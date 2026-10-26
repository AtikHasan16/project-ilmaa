import { createClient } from "@supabase/supabase-js";
import { getDeviceToken } from "../utils/deviceToken";

// Supabase Cloud Configuration
const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  "https://evjvqrxrevycnjxsnjdt.supabase.co";
const SUPABASE_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Helper: Convert snake_case (Postgres/Supabase) to camelCase (Frontend JavaScript)
function toCamel(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);

  const newObj = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === "id") newObj["_id"] = val;
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = val;
  }
  return newObj;
}

/**
 * Direct Supabase API Client implementing apiClient.get, .post, .patch, .delete
 * completely replacing localhost:5000 with direct Supabase HTTPS Port 443 calls!
 */
const apiClient = {
  async get(url, config = {}) {
    const params = config.params || {};

    // 1. Vocabulary Stats
    if (url === "/vocabulary/stats") {
      const { data: allWords } = await supabase.from("vocabularies").select("topic, uploaded_by");
      const byTopic = {};
      const uploadedTopicsMap = {};
      const activeTopicsMap = {};
      const listeningTopicsMap = {};
      let totalUploaded = 0;

      for (const w of allWords || []) {
        const top = w.topic || "Academic Word List: Sublist A";
        byTopic[top] = (byTopic[top] || 0) + 1;

        const lowerTopic = top.toLowerCase();
        const uploadedBy = (w.uploaded_by || "").toLowerCase();

        // 1. Check if explicitly tagged in uploaded_by (e.g. 'active:...', 'listening:...', 'uploaded:...')
        const isTaggedActive = uploadedBy.startsWith("active:") || uploadedBy.includes("active") || uploadedBy === "admin";
        const isTaggedListening = uploadedBy.startsWith("listening:") || uploadedBy.includes("listening");
        const isTaggedUploaded = uploadedBy.startsWith("uploaded:");

        // 2. Check topic title semantic heuristics
        const isListeningTitle =
          lowerTopic.includes("studying university") ||
          lowerTopic.includes("subjects") ||
          lowerTopic.includes("listening") ||
          lowerTopic.includes("1200");

        const isAcademicTitle = lowerTopic.includes("academic word list");

        if (isTaggedListening || (!isTaggedActive && !isTaggedUploaded && isListeningTitle)) {
          listeningTopicsMap[top] = (listeningTopicsMap[top] || 0) + 1;
        } else if (isTaggedActive || isAcademicTitle) {
          activeTopicsMap[top] = (activeTopicsMap[top] || 0) + 1;
        } else {
          totalUploaded += 1;
          uploadedTopicsMap[top] = (uploadedTopicsMap[top] || 0) + 1;
        }
      }

      // Default Academic Word List if empty in DB
      if (!activeTopicsMap["Academic Word List: Sublist A"]) {
        activeTopicsMap["Academic Word List: Sublist A"] = byTopic["Academic Word List: Sublist A"] || 300;
      }

      const uploadedTopics = Object.entries(uploadedTopicsMap).map(([title, count]) => ({
        title,
        count,
      }));

      const activeTopics = Object.entries(activeTopicsMap).map(([title, count]) => ({
        title,
        count,
      }));

      const listeningTopics = Object.entries(listeningTopicsMap).map(([title, count]) => ({
        title,
        count,
      }));

      return {
        data: {
          success: true,
          totalCount: (allWords || []).length,
          uploadedCount: totalUploaded,
          byTopic,
          activeTopics,
          listeningTopics,
          uploadedTopics,
        },
      };
    }

    // 2. Vocabulary List
    if (url === "/vocabulary") {
      let query = supabase.from("vocabularies").select("*");
      if (params.topic) {
        query = query.eq("topic", params.topic);
      }
      if (params.uploadedOnly === "true" || params.uploadedOnly === true) {
        query = query.not("uploaded_by", "is", null);
      }
      const { data } = await query;
      return { data: { success: true, count: (data || []).length, data: toCamel(data || []) } };
    }

    // 3. Vocabulary Progress
    if (url === "/vocabulary/progress") {
      const accessId = params.accessId || config.headers?.["x-access-id"];
      if (!accessId) return { data: { success: false, data: null } };

      const { data } = await supabase
        .from("vocabulary_progress")
        .select("*")
        .eq("access_id", String(accessId).trim())
        .limit(1);

      const record = data && data[0] ? toCamel(data[0]) : {
        accessId,
        masteredWords: [],
        incorrectWords: [],
        progressByTopic: {},
      };
      return { data: { success: true, data: record } };
    }

    // 4. Grammar Stats
    if (url === "/grammar/stats") {
      const { data: allQuestions } = await supabase.from("grammar_questions").select("module");
      const byModule = {};
      for (const q of allQuestions || []) {
        const mod = q.module || "general";
        byModule[mod] = (byModule[mod] || 0) + 1;
      }
      return {
        data: {
          success: true,
          totalCount: (allQuestions || []).length,
          byModule,
        },
      };
    }

    // 5. Grammar Questions
    if (url === "/grammar/questions") {
      let query = supabase.from("grammar_questions").select("*");
      const mod = params.module;
      if (mod && mod !== "all" && mod !== "mixed") {
        if (mod === "modifiers-dangling" || mod === "run-on-comma-splices") {
          query = query.or(`module.eq.${mod},module.eq.modifiers-and-splices`);
        } else {
          query = query.eq("module", mod);
        }
      }
      const { data } = await query;
      return { data: { success: true, count: (data || []).length, data: toCamel(data || []) } };
    }

    // 6. User Profile Metrics
    if (url === "/user/profile-metrics") {
      const accessId = params.accessId;
      const [{ data: progData }, { count: totalVocab }] = await Promise.all([
        supabase.from("vocabulary_progress").select("*").eq("access_id", String(accessId).trim()).limit(1),
        supabase.from("vocabularies").select("*", { count: "exact", head: true }),
      ]);

      const p = progData && progData[0] ? toCamel(progData[0]) : null;
      const masteredCount = p?.masteredWords?.length || 0;
      const inProgressCount = p?.incorrectWords?.length || 0;
      const totalSessions = p?.totalSessions || (masteredCount > 0 ? 1 : 0);
      const totalStudySeconds = p?.totalStudySeconds || masteredCount * 30 + inProgressCount * 20;

      return {
        data: {
          success: true,
          data: {
            totalVocabInCorpus: totalVocab || 300,
            masteredCount,
            inProgressCount,
            totalSessions,
            totalStudySeconds,
            highestGrammarScore: p?.highestGrammarScore || null,
          },
        },
      };
    }

    // 7. Admin Access Requests
    if (url === "/admin/access-requests") {
      const { data } = await supabase.from("users").select("*").eq("status", "pending_approval");
      return { data: { success: true, count: (data || []).length, data: toCamel(data || []) } };
    }

    // 8. Admin Users Audit
    if (url === "/admin/users-audit") {
      const { data: allUsers } = await supabase.from("users").select("*");
      const users = (allUsers || []).map((u) => {
        const lastSeen = u.last_active_at ? new Date(u.last_active_at).getTime() : 0;
        const isOnline = u.status === "approved" && Date.now() - lastSeen < 5 * 60 * 1000;
        return {
          id: u.id || u.access_id,
          name: u.name,
          accessId: u.access_id,
          role: u.role,
          status: u.status,
          deviceToken: u.device_token,
          deviceBound: !!u.device_token,
          createdAt: u.created_at,
          lastActiveAt: u.last_active_at,
          isOnline,
        };
      });

      const totalRegistered = users.length;
      const approvedCount = users.filter((u) => u.status === "approved").length;
      const activeNowCount = users.filter((u) => u.isOnline).length;

      return {
        data: {
          success: true,
          totalRegistered,
          approvedCount,
          activeNowCount,
          users,
          data: users,
        },
      };
    }

    // 9. Admin Audit Logs & Vocab Audit Logs
    if (url === "/admin/audit-logs" || url === "/vocabulary/audit-logs") {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false });
      return { data: { success: true, count: (data || []).length, data: toCamel(data || []) } };
    }

    throw new Error(`Unhandled GET endpoint: ${url}`);
  },

  async post(url, body = {}) {
    // 1. Auth: Validate Device on Page Load
    if (url === "/auth/validate-device") {
      const { accessId, deviceToken } = body;
      const cleanId = String(accessId || "").trim();
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("access_id", cleanId)
        .eq("status", "approved")
        .limit(1);

      const user = data && data[0] ? toCamel(data[0]) : null;
      if (!user || user.deviceToken !== deviceToken) {
        return { data: { success: false, message: "Session invalid or device not approved" } };
      }

      // Update activity
      supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("access_id", cleanId).then();

      return {
        data: {
          success: true,
          status: "approved",
          role: user.role,
          user: { name: user.name, accessId: user.accessId, role: user.role },
        },
      };
    }

    // 2. Auth: Login Request
    if (url === "/auth/login-request") {
      const { name, accessId, deviceToken } = body;
      const cleanId = String(accessId || "").trim();
      const cleanName = String(name || "").trim().toLowerCase();

      const { data } = await supabase.from("users").select("*").eq("access_id", cleanId).limit(1);
      const user = data && data[0] ? toCamel(data[0]) : null;

      if (!user) {
        // Record failed login audit
        supabase.from("audit_logs").insert({
          action: "LOGIN_FAILED",
          user_name: name || "Unknown",
          access_id: cleanId,
          details: "Login failed: Invalid Access ID",
          timestamp: new Date().toISOString(),
        }).then();

        const err = new Error("Invalid Access ID or Name. Please check with administrator.");
        err.response = { data: { success: false, message: "Invalid Access ID or Name." } };
        throw err;
      }

      if (user.name.trim().toLowerCase() !== cleanName) {
        supabase.from("audit_logs").insert({
          action: "LOGIN_NAME_MISMATCH",
          user_name: name || "Unknown",
          access_id: cleanId,
          details: `Name mismatch attempted for ${user.name}`,
          timestamp: new Date().toISOString(),
        }).then();

        const err = new Error("Name does not match the provided Access ID.");
        err.response = { data: { success: false, message: "Name does not match the provided Access ID." } };
        throw err;
      }

      // Already approved
      if (user.status === "approved" && (user.deviceToken === deviceToken || !user.deviceToken)) {
        if (!user.deviceToken) {
          await supabase.from("users").update({ device_token: deviceToken }).eq("access_id", cleanId);
        }
        await supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("access_id", cleanId);

        // Record successful login in audit log
        await supabase.from("audit_logs").insert({
          action: "LOGIN_SUCCESS",
          user_name: user.name,
          access_id: cleanId,
          details: `Candidate successfully logged in (${user.role} role)`,
          timestamp: new Date().toISOString(),
        });

        return {
          data: {
            success: true,
            status: "approved",
            role: user.role,
            user: { name: user.name, accessId: user.accessId, role: user.role },
          },
        };
      }

      if (user.status === "approved" && user.deviceToken !== deviceToken) {
        await supabase.from("audit_logs").insert({
          action: "DEVICE_MISMATCH",
          user_name: user.name,
          access_id: cleanId,
          details: "Login rejected: Candidate attempted login from unauthorized device",
          timestamp: new Date().toISOString(),
        });

        const err = new Error("This ID is bound to another browser/device.");
        err.response = { data: { success: false, status: "device_mismatch", message: "This ID is bound to another browser/device." } };
        throw err;
      }

      if (user.status === "rejected") {
        const err = new Error("Your access request was rejected.");
        err.response = { data: { success: false, status: "rejected", message: "Your access request was rejected." } };
        throw err;
      }

      // Request approval
      await supabase.from("users").update({
        status: "pending_approval",
        requested_device_token: deviceToken,
      }).eq("access_id", cleanId);

      // Record access request in audit log
      await supabase.from("audit_logs").insert({
        action: "ACCESS_REQUESTED",
        user_name: user.name,
        access_id: cleanId,
        details: "New device registration submitted, awaiting admin approval",
        timestamp: new Date().toISOString(),
      });

      return {
        data: {
          success: true,
          status: "pending_approval",
          message: "Access request submitted. Awaiting administrator approval.",
        },
      };
    }

    // 3. Auth: Heartbeat
    if (url === "/auth/heartbeat") {
      const deviceToken = getDeviceToken();
      if (deviceToken) {
        supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("device_token", deviceToken).then();
      }
      return { data: { success: true } };
    }

    // 4. Record Vocabulary Progress
    if (url === "/vocabulary/progress") {
      const { accessId, word, isCorrect, topic = "Academic Word List: Sublist A" } = body;
      const cleanId = String(accessId).trim();
      const cleanWord = String(word).trim();

      const { data } = await supabase.from("vocabulary_progress").select("*").eq("access_id", cleanId).limit(1);
      let record = data && data[0] ? toCamel(data[0]) : null;

      let mastered = record?.masteredWords ? [...record.masteredWords] : [];
      let incorrect = record?.incorrectWords ? [...record.incorrectWords] : [];
      const topicStats = record?.progressByTopic || {};
      const currTopic = topicStats[topic] || { mastered: 0, incorrect: 0 };

      if (isCorrect) {
        if (!mastered.includes(cleanWord)) mastered.push(cleanWord);
        incorrect = incorrect.filter((w) => w !== cleanWord);
      } else {
        if (!incorrect.includes(cleanWord)) incorrect.push(cleanWord);
        mastered = mastered.filter((w) => w !== cleanWord);
      }

      currTopic.mastered = mastered.length;
      currTopic.incorrect = incorrect.length;
      topicStats[topic] = currTopic;

      const payload = {
        access_id: cleanId,
        mastered_words: mastered,
        incorrect_words: incorrect,
        progress_by_topic: topicStats,
        updated_at: new Date().toISOString(),
      };

      await supabase.from("vocabulary_progress").upsert(payload, { onConflict: "access_id" });

      return {
        data: {
          success: true,
          data: {
            masteredWords: mastered,
            incorrectWords: incorrect,
            progressByTopic: topicStats,
          },
        },
      };
    }

    // 5. Reset Topic Progress
    if (url === "/vocabulary/progress/reset") {
      const { accessId, topic } = body;
      const cleanId = String(accessId).trim();
      const { data } = await supabase.from("vocabulary_progress").select("*").eq("access_id", cleanId).limit(1);
      const record = data && data[0] ? toCamel(data[0]) : null;

      if (record) {
        const topicStats = record.progressByTopic || {};
        if (topic) delete topicStats[topic];
        await supabase.from("vocabulary_progress").update({
          mastered_words: topic ? record.masteredWords : [],
          incorrect_words: topic ? record.incorrectWords : [],
          progress_by_topic: topic ? topicStats : {},
          updated_at: new Date().toISOString(),
        }).eq("access_id", cleanId);
      }
      return { data: { success: true, message: "Progress reset successfully" } };
    }

    // 6. Record Study Session
    if (url === "/user/study-session") {
      const { accessId, durationSeconds = 0, grammarScore = null, totalQuestions = null } = body;
      const cleanId = String(accessId).trim();
      const { data } = await supabase.from("vocabulary_progress").select("*").eq("access_id", cleanId).limit(1);
      const record = data && data[0] ? toCamel(data[0]) : { totalSessions: 0, totalStudySeconds: 0 };

      const newSessions = (record.totalSessions || 0) + 1;
      const newSeconds = (record.totalStudySeconds || 0) + Math.max(0, parseInt(durationSeconds, 10) || 0);

      let highestScore = record.highestGrammarScore || null;
      if (grammarScore !== null && totalQuestions !== null && totalQuestions > 0) {
        const currentPct = Math.round((grammarScore / totalQuestions) * 100);
        const prevPct = highestScore ? Math.round((highestScore.score / highestScore.total) * 100) : -1;
        if (currentPct > prevPct) {
          highestScore = {
            score: grammarScore,
            total: totalQuestions,
            percent: currentPct,
            achievedAt: new Date().toISOString(),
          };
        }
      }

      await supabase.from("vocabulary_progress").upsert({
        access_id: cleanId,
        total_sessions: newSessions,
        total_study_seconds: newSeconds,
        highest_grammar_score: highestScore,
        updated_at: new Date().toISOString(),
      }, { onConflict: "access_id" });

      return {
        data: {
          success: true,
          data: { totalSessions: newSessions, totalStudySeconds: newSeconds, highestGrammarScore: highestScore },
        },
      };
    }

    // 7. Upload Single Word
    if (url === "/vocabulary") {
      const { word, pos, banglaMeaning, synonyms, exampleUsage, topic, targetTab = "active", uploadedBy } = body;
      const synList = Array.isArray(synonyms)
        ? synonyms
        : typeof synonyms === "string"
        ? synonyms.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      // Encode destination in uploaded_by so stats can always accurately categorize
      const resolvedUploader =
        uploadedBy && uploadedBy.includes(":")
          ? uploadedBy
          : `${targetTab}:${uploadedBy || "user"}`;

      const newWord = {
        word: word.trim(),
        pos: (pos || "Unknown").trim(),
        bangla_meaning: banglaMeaning.trim(),
        synonyms: synList,
        example_usage: (exampleUsage || "").trim(),
        topic: topic || "Uploaded",
        uploaded_by: resolvedUploader,
      };

      const { data } = await supabase.from("vocabularies").insert(newWord).select();

      await supabase.from("audit_logs").insert({
        action: "VOCAB_UPLOADED",
        user_name: uploadedBy || "candidate",
        access_id: "STUDENT",
        details: `Uploaded word "${word.trim()}" to topic "${newWord.topic}" [tab: ${targetTab}]`,
        timestamp: new Date().toISOString(),
      });

      return { data: { success: true, message: "Word uploaded successfully", data: toCamel(data?.[0] || newWord) } };
    }

    // 8. Bulk Import Words
    if (url === "/vocabulary/bulk") {
      const { items, defaultTopic = "Uploaded", targetTab = "active", uploadedBy = "bulk-upload" } = body;
      const resolvedUploader =
        uploadedBy && uploadedBy.includes(":")
          ? uploadedBy
          : `${targetTab}:${uploadedBy || "bulk-import"}`;

      const docs = (items || []).map((row) => ({
        word: row.word.trim(),
        pos: (row.pos || "Unknown").trim(),
        bangla_meaning: row.banglaMeaning.trim(),
        synonyms: Array.isArray(row.synonyms) ? row.synonyms : [],
        example_usage: (row.exampleUsage || "").trim(),
        topic: (row.topic || defaultTopic).trim(),
        uploaded_by: resolvedUploader,
      }));

      await supabase.from("vocabularies").insert(docs);
      await supabase.from("audit_logs").insert({
        action: "VOCAB_BULK_UPLOAD",
        user_name: uploadedBy || "admin",
        access_id: uploadedBy?.toLowerCase().includes("admin") ? "ADMIN" : "SYSTEM",
        details: `Bulk imported ${docs.length} words under "${defaultTopic}" [tab: ${targetTab}]`,
        timestamp: new Date().toISOString(),
      });

      return { data: { success: true, count: docs.length, message: `Successfully imported ${docs.length} words` } };
    }

    // 9. Admin Generate ID
    if (url === "/admin/access-ids") {
      const { name, role = "general" } = body;
      let accessId = "";
      let isUnique = false;
      while (!isUnique) {
        accessId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const { data } = await supabase.from("users").select("id").eq("access_id", accessId).limit(1);
        if (!data || data.length === 0) isUnique = true;
      }

      const newUser = {
        name: name.trim(),
        access_id: accessId,
        role: ["general", "advance", "admin"].includes(role) ? role : "general",
        status: "unclaimed",
        device_token: null,
        requested_device_token: null,
      };

      const { data } = await supabase.from("users").insert(newUser).select();

      await supabase.from("audit_logs").insert({
        action: "ID_GENERATED",
        user_name: newUser.name,
        access_id: accessId,
        details: `Generated new 10-digit ID with ${newUser.role} role`,
        timestamp: new Date().toISOString(),
      });

      return { data: { success: true, message: "Access ID generated successfully", data: toCamel(data?.[0] || newUser) } };
    }

    throw new Error(`Unhandled POST endpoint: ${url}`);
  },

  async patch(url) {
    // 1. Approve Access Request
    if (url.startsWith("/admin/access-requests/") && url.endsWith("/approve")) {
      const accessId = url.split("/")[3];
      const { data: userData } = await supabase.from("users").select("*").eq("access_id", accessId).limit(1);
      const user = userData?.[0];

      await supabase.from("users").update({
        status: "approved",
        device_token: user?.requested_device_token || "token-" + Date.now(),
      }).eq("access_id", accessId);

      await supabase.from("audit_logs").insert({
        action: "ACCESS_APPROVED",
        user_name: user?.name || "Candidate",
        access_id: accessId,
        details: `Approved device access with role: ${user?.role || "general"}`,
        timestamp: new Date().toISOString(),
      });

      return { data: { success: true, message: `Access approved for candidate` } };
    }

    // 2. Reject Access Request
    if (url.startsWith("/admin/access-requests/") && url.endsWith("/reject")) {
      const accessId = url.split("/")[3];
      const { data: userData } = await supabase.from("users").select("name").eq("access_id", accessId).limit(1);
      await supabase.from("users").update({ status: "rejected" }).eq("access_id", accessId);

      await supabase.from("audit_logs").insert({
        action: "ACCESS_REJECTED",
        user_name: userData?.[0]?.name || "Candidate",
        access_id: accessId,
        details: "Access request rejected by admin",
        timestamp: new Date().toISOString(),
      });

      return { data: { success: true, message: "Request rejected" } };
    }

    // 3. Reset Hardware Device
    if (url.startsWith("/admin/users/") && url.endsWith("/reset-device")) {
      const accessId = url.split("/")[3];
      const { data: userData } = await supabase.from("users").select("name").eq("access_id", accessId).limit(1);

      await supabase.from("users").update({
        status: "unclaimed",
        device_token: null,
        requested_device_token: null,
      }).eq("access_id", accessId);

      await supabase.from("audit_logs").insert({
        action: "DEVICE_RESET",
        user_name: userData?.[0]?.name || "Candidate",
        access_id: accessId,
        details: "Admin reset hardware device binding lock",
        timestamp: new Date().toISOString(),
      });

      return { data: { success: true, message: "Device lock cleared successfully" } };
    }

    throw new Error(`Unhandled PATCH endpoint: ${url}`);
  },

  async delete(url, config = {}) {
    // 1. Delete Vocabulary Topic (card and all terms in it)
    if (url === "/vocabulary/topic") {
      const topicName = config.data?.topic;
      const deletedBy = config.data?.deletedBy || "admin";
      if (!topicName) {
        throw new Error("Missing topic name to delete");
      }

      const { data: existingWords } = await supabase
        .from("vocabularies")
        .select("id")
        .eq("topic", topicName);
      const count = existingWords?.length || 0;

      await supabase.from("vocabularies").delete().eq("topic", topicName);

      await supabase.from("audit_logs").insert({
        action: "VOCAB_TOPIC_DELETED",
        user_name: deletedBy,
        access_id: "ADMIN",
        details: `Deleted topic "${topicName}" (${count} words removed)`,
        timestamp: new Date().toISOString(),
      });

      return {
        data: {
          success: true,
          message: `Topic "${topicName}" and all its ${count} words deleted successfully.`,
          deletedCount: count,
        },
      };
    }

    // 2. Delete Single Vocabulary Word
    if (url.startsWith("/vocabulary/")) {
      const wordId = url.split("/")[2];
      await supabase.from("vocabularies").delete().eq("id", wordId);
      return { data: { success: true, message: "Word deleted successfully" } };
    }

    // 3. Delete Single Audit Log
    if (url.startsWith("/admin/audit-logs/")) {
      const logId = url.split("/")[3];
      await supabase.from("audit_logs").delete().eq("id", logId);
      return { data: { success: true, message: "Audit log deleted" } };
    }

    // 4. Delete All Audit Logs
    if (url === "/admin/audit-logs") {
      await supabase.from("audit_logs").delete().neq("action", "");
      return { data: { success: true, message: "All audit logs cleared" } };
    }

    throw new Error(`Unhandled DELETE endpoint: ${url}`);
  },
};

export default apiClient;
