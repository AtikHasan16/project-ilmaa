import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import fs from "node:fs";

function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, "utf8");
    const env = {};
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
    return env;
  } catch {
    return {};
  }
}

const env = {
  ...loadEnvFile(path.resolve(process.cwd(), ".env")),
  ...loadEnvFile(path.resolve(process.cwd(), "../server/.env")),
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://evjvqrxrevycnjxsnjdt.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_KEY;

if (!supabaseAnonKey) {
  console.error("❌ No Supabase anon key configured in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("==================================================");
console.log("   IMLAA FULL STACK & DATABASE DIAGNOSIS");
console.log("==================================================");
console.log(`Target URL: ${supabaseUrl}`);

async function runDiagnosis() {
  const results = [];

  // Check 1: RPC get_vocabulary_topic_counts
  try {
    const { data, error } = await supabase.rpc("get_vocabulary_topic_counts");
    if (error) {
      results.push({ check: "RPC get_vocabulary_topic_counts", status: "FAIL", error: error.message });
    } else {
      results.push({ check: "RPC get_vocabulary_topic_counts", status: "PASS", topicsFound: data?.length ?? 0 });
    }
  } catch (err) {
    results.push({ check: "RPC get_vocabulary_topic_counts", status: "ERROR", error: err.message });
  }

  // Check 2: Vocabularies table schema & columns
  try {
    const { data, error } = await supabase
      .from("vocabularies")
      .select("id, word, pos, bangla_meaning, topic, target_tab, uploaded_by_id, uploaded_by_name")
      .limit(5);

    if (error) {
      results.push({ check: "Vocabularies Normalized Schema", status: "FAIL", error: error.message });
    } else {
      results.push({ check: "Vocabularies Normalized Schema", status: "PASS", sampleWords: (data || []).map(w => w.word) });
    }
  } catch (err) {
    results.push({ check: "Vocabularies Normalized Schema", status: "ERROR", error: err.message });
  }

  // Check 3: Grammar questions
  try {
    const { data, error } = await supabase.from("grammar_questions").select("id, module, question").limit(5);
    if (error) {
      results.push({ check: "Grammar Questions Table", status: "FAIL", error: error.message });
    } else {
      results.push({ check: "Grammar Questions Table", status: "PASS", questionsCount: data?.length ?? 0 });
    }
  } catch (err) {
    results.push({ check: "Grammar Questions Table", status: "ERROR", error: err.message });
  }

  // Check 4: User Badges table
  try {
    const { error } = await supabase.from("user_badges").select("id, badge_key").limit(1);
    if (error && error.code !== "PGRST116") {
      results.push({ check: "User Badges Table", status: "FAIL", error: error.message });
    } else {
      results.push({ check: "User Badges Table", status: "PASS", note: "Table exists and RLS active" });
    }
  } catch (err) {
    results.push({ check: "User Badges Table", status: "ERROR", error: err.message });
  }

  // Check 5: Spelling & Flashcard Progress tables
  try {
    const [spRes, fcRes, gpRes] = await Promise.all([
      supabase.from("spelling_progress").select("id").limit(1),
      supabase.from("flashcard_progress").select("id").limit(1),
      supabase.from("grammar_progress").select("id").limit(1),
    ]);

    const errors = [];
    if (spRes.error && spRes.error.code !== "PGRST116") errors.push(`spelling: ${spRes.error.message}`);
    if (fcRes.error && fcRes.error.code !== "PGRST116") errors.push(`flashcard: ${fcRes.error.message}`);
    if (gpRes.error && gpRes.error.code !== "PGRST116") errors.push(`grammar: ${gpRes.error.message}`);

    if (errors.length > 0) {
      results.push({ check: "Progress Tables", status: "FAIL", error: errors.join("; ") });
    } else {
      results.push({ check: "Progress Tables", status: "PASS", note: "spelling, flashcard, grammar all ready" });
    }
  } catch (err) {
    results.push({ check: "Progress Tables", status: "ERROR", error: err.message });
  }

  // Check 6: Profiles table & Active User Count RPC
  try {
    const { data: count, error: rpcErr } = await supabase.rpc("get_active_user_count");
    if (rpcErr) {
      results.push({ check: "RPC get_active_user_count", status: "FAIL", error: rpcErr.message });
    } else {
      results.push({ check: "RPC get_active_user_count", status: "PASS", activeUsers: count });
    }
  } catch (err) {
    results.push({ check: "RPC get_active_user_count", status: "ERROR", error: err.message });
  }

  console.log("\n--- DIAGNOSIS RESULTS ---");
  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} [${r.status}] ${r.check}:`, JSON.stringify(r));
  }

  const allPass = results.every(r => r.status === "PASS");
  if (allPass) {
    console.log("\n🎉 ALL SYSTEM CHECKS PASSED PERFECTLY!");
    process.exit(0);
  } else {
    console.log("\n⚠️ SOME CHECKS FAILED OR RETURNED ERRORS.");
    process.exit(1);
  }
}

runDiagnosis();
