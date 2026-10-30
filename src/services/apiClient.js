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
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
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

function requireSupabaseUserId(userId) {
  const cleanId = String(userId || "").trim();
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(cleanId)) {
    throw new Error("A valid signed-in Supabase user ID is required for progress.");
  }
  return cleanId;
}

async function loadVocabularyProgress(userId) {
  const { data, error } = await supabase
    .from("spelling_progress")
    .select("topic, mastered_words, incorrect_words, last_index")
    .eq("user_id", userId);

  if (error) throw error;

  const masteredWords = new Set();
  const incorrectWords = new Set();
  const progressByTopic = {};

  for (const row of data || []) {
    const mastered = row.mastered_words || [];
    const incorrect = row.incorrect_words || [];
    mastered.forEach((word) => masteredWords.add(word));
    incorrect.forEach((word) => incorrectWords.add(word));
    progressByTopic[row.topic] = {
      mastered: mastered.length,
      incorrect: incorrect.length,
      lastIndex: row.last_index || 0,
    };
  }

  return {
    masteredWords: [...masteredWords],
    incorrectWords: [...incorrectWords],
    progressByTopic,
  };
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
      const reqUserId = params.userId || "";
      const reqUserRole = params.userRole || "general";
      const reqUserName = (params.userName || "").toLowerCase();
      const isAdmin = reqUserRole === "admin";

      const byTopic = {};
      const uploadedTopicsMap = {};
      const activeTopicsMap = {};
      const listeningTopicsMap = {};
      let totalUploaded = 0;

      for (const w of allWords || []) {
        const top = w.topic || "Academic Word List: Sublist A";
        const lowerTopic = top.toLowerCase();
        const uploadedBy = (w.uploaded_by || "").toLowerCase();
        const uploaderRaw = w.uploaded_by || "";

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

        let assignedTab;
        if (isTaggedListening || (!isTaggedActive && !isTaggedUploaded && isListeningTitle)) {
          assignedTab = "listening";
        } else if (isTaggedActive || isAcademicTitle) {
          assignedTab = "active";
        } else {
          assignedTab = "uploaded";
        }

        // Parse uploader name: "uploaded:userId:userName" or "uploaded:userName"
        let parsedUploaderName = "";
        let parsedUploaderId = "";
        if (uploaderRaw.includes(":")) {
          const segs = uploaderRaw.split(":");
          if (segs.length >= 3) {
            parsedUploaderId = segs[1];
            parsedUploaderName = segs.slice(2).join(":");
          } else if (segs.length === 2) {
            parsedUploaderName = segs[1];
          }
        }

        // Rule 1: Uploaded vocabulary is ONLY visible to the candidate who uploaded it (or Admin)
        if (assignedTab === "uploaded" && !isAdmin) {
          const matchesId = reqUserId && (parsedUploaderId === reqUserId || uploadedBy.includes(reqUserId.toLowerCase()));
          const matchesName = reqUserName && (parsedUploaderName.toLowerCase() === reqUserName || uploadedBy.includes(reqUserName));
          if (!matchesId && !matchesName) {
            // Belongs to someone else -> hide from this candidate
            continue;
          }
        }

        byTopic[top] = (byTopic[top] || 0) + 1;

        if (assignedTab === "listening") {
          listeningTopicsMap[top] = (listeningTopicsMap[top] || 0) + 1;
        } else if (assignedTab === "active") {
          activeTopicsMap[top] = (activeTopicsMap[top] || 0) + 1;
        } else {
          totalUploaded += 1;
          if (!uploadedTopicsMap[top]) {
            uploadedTopicsMap[top] = {
              count: 0,
              uploaderName: parsedUploaderName || (isAdmin ? "Admin" : (params.userName || "Candidate")),
            };
          }
          uploadedTopicsMap[top].count += 1;
          if (parsedUploaderName && !uploadedTopicsMap[top].uploaderName) {
            uploadedTopicsMap[top].uploaderName = parsedUploaderName;
          }
        }
      }

      // Default Academic Word List if empty in DB
      if (!activeTopicsMap["Academic Word List: Sublist A"]) {
        activeTopicsMap["Academic Word List: Sublist A"] = byTopic["Academic Word List: Sublist A"] || 300;
      }

      const uploadedTopics = Object.entries(uploadedTopicsMap).map(([title, info]) => ({
        title,
        count: info.count,
        uploaderName: info.uploaderName,
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
      let words = toCamel(data || []);

      // If user is not admin, filter out any uploaded words that do not belong to this user
      const reqUserId = params.userId || "";
      const reqUserName = (params.userName || "").toLowerCase();
      const isAdmin = params.userRole === "admin";

      if (!isAdmin && (reqUserId || reqUserName)) {
        words = words.filter((w) => {
          const uploaderRaw = (w.uploadedBy || w.uploaded_by || "").toLowerCase();
          const isTaggedActive = uploaderRaw.startsWith("active:") || uploaderRaw.includes("active") || uploaderRaw === "admin";
          const isTaggedListening = uploaderRaw.startsWith("listening:") || uploaderRaw.includes("listening");
          const top = (w.topic || "").toLowerCase();
          const isAcademic = top.includes("academic word list");
          const isListening = top.includes("studying university") || top.includes("subjects") || top.includes("listening") || top.includes("1200");

          if (isTaggedActive || isTaggedListening || isAcademic || isListening) {
            return true;
          }

          // If uploaded, verify ownership
          const matchesId = reqUserId && uploaderRaw.includes(reqUserId.toLowerCase());
          const matchesName = reqUserName && uploaderRaw.includes(reqUserName);
          return matchesId || matchesName;
        });
      }

      return { data: { success: true, count: words.length, data: words } };
    }

    // 3. Vocabulary Progress
    if (url === "/vocabulary/progress") {
      const accessId = params.userId || params.accessId || config.headers?.["x-access-id"];
      if (!accessId) return { data: { success: false, data: null } };
      const record = await loadVocabularyProgress(requireSupabaseUserId(accessId));
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
      const userId = requireSupabaseUserId(params.userId || params.accessId);
      const [
        { data: spellingRows, error: spellingError },
        { data: flashcardRows, error: flashcardError },
        { data: activityRows, error: activityError },
        { data: grammarData, error: grammarError },
        { count: totalVocab, error: vocabError },
      ] = await Promise.all([
        supabase.from("spelling_progress").select("mastered_words, incorrect_words").eq("user_id", userId),
        supabase.from("flashcard_progress").select("known_words, unknown_words, forgot_words").eq("user_id", userId),
        supabase.from("user_activity_logs").select("duration_seconds").eq("user_id", userId).eq("action", "STUDY_SESSION"),
        supabase.from("grammar_progress").select("highest_score, total_questions").eq("user_id", userId).maybeSingle(),
        supabase.from("vocabularies").select("*", { count: "exact", head: true }),
      ]);

      const queryError = spellingError || flashcardError || activityError || grammarError || vocabError;
      if (queryError) throw queryError;

      const masteredWords = new Set();
      const inProgressWords = new Set();
      for (const row of spellingRows || []) {
        (row.mastered_words || []).forEach((word) => masteredWords.add(word));
        (row.incorrect_words || []).forEach((word) => inProgressWords.add(word));
      }
      for (const row of flashcardRows || []) {
        (row.known_words || []).forEach((word) => masteredWords.add(word));
        (row.unknown_words || []).forEach((word) => inProgressWords.add(word));
        (row.forgot_words || []).forEach((word) => inProgressWords.add(word));
      }

      const totalSessions = (activityRows || []).length || (masteredWords.size > 0 ? 1 : 0);
      const recordedSeconds = (activityRows || []).reduce(
        (total, row) => total + Math.max(0, Number(row.duration_seconds) || 0),
        0,
      );
      const totalStudySeconds =
        recordedSeconds || masteredWords.size * 30 + inProgressWords.size * 20;
      const highestGrammarScore = grammarData?.highest_score
        ? {
            score: grammarData.highest_score,
            total: grammarData.total_questions || 0,
            percent: grammarData.total_questions
              ? Math.round((grammarData.highest_score / grammarData.total_questions) * 100)
              : 0,
          }
        : null;

      return {
        data: {
          success: true,
          data: {
            totalVocabInCorpus: totalVocab || 300,
            masteredCount: masteredWords.size,
            inProgressCount: inProgressWords.size,
            totalSessions,
            totalStudySeconds,
            highestGrammarScore,
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
      let { data: allProfiles, error: profErr } = await supabase.from("profiles").select("*");
      if (profErr || !allProfiles || allProfiles.length === 0) {
        const { data: legacyUsers } = await supabase.from("users").select("*");
        allProfiles = legacyUsers || [];
      }

      const users = (allProfiles || []).map((u) => {
        const lastSeen = u.last_active_at ? new Date(u.last_active_at).getTime() : 0;
        const isOnline = Date.now() - lastSeen < 5 * 60 * 1000;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          accessId: u.access_id || u.id?.slice(0, 8),
          role: u.role || "general",
          status: "approved",
          avatarUrl: u.avatar_url,
          authProvider: u.auth_provider || "email",
          deviceInfo: u.device_info || {},
          createdAt: u.created_at,
          lastActiveAt: u.last_active_at,
          isOnline,
        };
      });

      const totalRegistered = users.length;
      const approvedCount = users.length;
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

    // 10. Flashcard Progress
    if (url === "/flashcard/progress") {
      const userId = params.userId || params.accessId;
      const topic = params.topic || "Academic Word List: Sublist A";
      if (!userId) {
        return { data: { success: false, data: { knownWords: [], unknownWords: [], forgotWords: [], lastIndex: 0 } } };
      }

      const cleanId = requireSupabaseUserId(userId);
      const { data, error } = await supabase
        .from("flashcard_progress")
        .select("*")
        .eq("user_id", cleanId)
        .eq("topic", topic)
        .maybeSingle();

      if (error) throw error;
      return {
        data: {
          success: true,
          data: toCamel(data || {
            known_words: [],
            unknown_words: [],
            forgot_words: [],
            last_index: 0,
          }),
        },
      };
    }

    // 11. Spelling Progress
    if (url === "/spelling/progress") {
      const userId = params.userId || params.accessId;
      const topic = params.topic || "Academic Word List: Sublist A";
      if (!userId) {
        return { data: { success: false, data: { masteredWords: [], incorrectWords: [], lastIndex: 0 } } };
      }

      const cleanId = requireSupabaseUserId(userId);
      const { data, error } = await supabase
        .from("spelling_progress")
        .select("*")
        .eq("user_id", cleanId)
        .eq("topic", topic)
        .maybeSingle();

      if (error) throw error;
      return {
        data: {
          success: true,
          data: toCamel(data || {
            mastered_words: [],
            incorrect_words: [],
            last_index: 0,
          }),
        },
      };
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
      const { userId, accessId, word, isCorrect, topic = "Academic Word List: Sublist A", currentIndex = 0 } = body;
      const cleanId = requireSupabaseUserId(userId || accessId);
      const cleanWord = String(word || "").trim();
      if (!cleanWord) {
        return { data: { success: false, message: "Missing word" } };
      }

      const { data: existing, error: selectError } = await supabase
        .from("spelling_progress")
        .select("mastered_words, incorrect_words")
        .eq("user_id", cleanId)
        .eq("topic", topic)
        .maybeSingle();
      if (selectError) throw selectError;

      let mastered = existing?.mastered_words || [];
      let incorrect = existing?.incorrect_words || [];

      if (isCorrect) {
        if (!mastered.includes(cleanWord)) mastered.push(cleanWord);
        incorrect = incorrect.filter((w) => w !== cleanWord);
      } else {
        if (!incorrect.includes(cleanWord)) incorrect.push(cleanWord);
        mastered = mastered.filter((w) => w !== cleanWord);
      }

      const payload = {
        user_id: cleanId,
        topic,
        mastered_words: mastered,
        incorrect_words: incorrect,
        last_index: currentIndex,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("spelling_progress")
        .upsert(payload, { onConflict: "user_id,topic" });
      if (upsertError) throw upsertError;

      return {
        data: {
          success: true,
          data: await loadVocabularyProgress(cleanId),
        },
      };
    }

    // 5. Reset Topic Progress
    if (url === "/vocabulary/progress/reset") {
      const cleanId = requireSupabaseUserId(body.userId || body.accessId);
      let query = supabase.from("spelling_progress").delete().eq("user_id", cleanId);
      if (body.topic) query = query.eq("topic", body.topic);
      const { error } = await query;
      if (error) throw error;
      return { data: { success: true, message: "Progress reset successfully" } };
    }

    // 5b. Record Flashcard Progress (Known, Unknown, Forgot)
    if (url === "/flashcard/progress") {
      const { userId, accessId, topic = "Academic Word List: Sublist A", word, status, lastIndex = 0 } = body;
      const targetUserId = requireSupabaseUserId(userId || accessId);
      const cleanWord = String(word || "").trim();
      if (!cleanWord) {
        return { data: { success: false, message: "Missing userId or word" } };
      }

      const { data: existing, error: selectError } = await supabase
        .from("flashcard_progress")
        .select("*")
        .eq("user_id", targetUserId)
        .eq("topic", topic)
        .maybeSingle();
      if (selectError) throw selectError;

      let known = existing?.known_words || [];
      let unknown = existing?.unknown_words || [];
      let forgot = existing?.forgot_words || [];

      known = known.filter((w) => w !== cleanWord);
      unknown = unknown.filter((w) => w !== cleanWord);
      forgot = forgot.filter((w) => w !== cleanWord);

      if (status === "knew") {
        known.push(cleanWord);
      } else if (status === "forgot") {
        forgot.push(cleanWord);
      } else {
        unknown.push(cleanWord);
      }

      const payload = {
        user_id: targetUserId,
        topic,
        known_words: known,
        unknown_words: unknown,
        forgot_words: forgot,
        last_index: lastIndex,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("flashcard_progress")
        .upsert(payload, { onConflict: "user_id,topic" });
      if (upsertError) throw upsertError;

      return {
        data: {
          success: true,
          data: {
            knownWords: known,
            unknownWords: unknown,
            forgotWords: forgot,
            lastIndex,
          },
        },
      };
    }

    // 5c. Reset Flashcard Progress
    if (url === "/flashcard/progress/reset") {
      const { userId, accessId, topic } = body;
      const targetUserId = requireSupabaseUserId(userId || accessId);
      if (targetUserId && topic) {
        const { error } = await supabase
          .from("flashcard_progress")
          .delete()
          .eq("user_id", targetUserId)
          .eq("topic", topic);
        if (error) throw error;
      }
      return { data: { success: true, message: "Flashcard progress reset" } };
    }

    // 5d. Record Spelling Progress (Mastered vs Incorrect)
    if (url === "/spelling/progress") {
      const { userId, accessId, topic = "Academic Word List: Sublist A", word, isCorrect, lastIndex = 0 } = body;
      const targetUserId = requireSupabaseUserId(userId || accessId);
      const cleanWord = String(word || "").trim();
      if (!cleanWord) {
        return { data: { success: false, message: "Missing userId or word" } };
      }

      const { data: existing, error: selectError } = await supabase
        .from("spelling_progress")
        .select("*")
        .eq("user_id", targetUserId)
        .eq("topic", topic)
        .maybeSingle();
      if (selectError) throw selectError;

      let mastered = existing?.mastered_words || [];
      let incorrect = existing?.incorrect_words || [];

      mastered = mastered.filter((w) => w !== cleanWord);
      incorrect = incorrect.filter((w) => w !== cleanWord);

      if (isCorrect) {
        mastered.push(cleanWord);
      } else {
        incorrect.push(cleanWord);
      }

      const payload = {
        user_id: targetUserId,
        topic,
        mastered_words: mastered,
        incorrect_words: incorrect,
        last_index: lastIndex,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("spelling_progress")
        .upsert(payload, { onConflict: "user_id,topic" });
      if (upsertError) throw upsertError;

      return {
        data: {
          success: true,
          data: {
            masteredWords: mastered,
            incorrectWords: incorrect,
            lastIndex,
          },
        },
      };
    }

    // 5e. Reset Spelling Progress
    if (url === "/spelling/progress/reset") {
      const { userId, accessId, topic } = body;
      const targetUserId = requireSupabaseUserId(userId || accessId);
      if (targetUserId && topic) {
        const { error } = await supabase
          .from("spelling_progress")
          .delete()
          .eq("user_id", targetUserId)
          .eq("topic", topic);
        if (error) throw error;
      }
      return { data: { success: true, message: "Spelling progress reset" } };
    }

    // 6. Record Study Session
    if (url === "/user/study-session") {
      const { userId, accessId, durationSeconds = 0, grammarScore = null, totalQuestions = null } = body;
      const cleanId = requireSupabaseUserId(userId || accessId);
      const cleanDuration = Math.max(0, Number.parseInt(durationSeconds, 10) || 0);
      const timestamp = new Date().toISOString();
      const hasGrammarScore =
        grammarScore !== null &&
        grammarScore !== undefined &&
        totalQuestions !== null &&
        totalQuestions !== undefined &&
        Number.isFinite(Number(grammarScore)) &&
        Number.isFinite(Number(totalQuestions)) &&
        Number(totalQuestions) > 0;

      const { error: activityError } = await supabase.from("user_activity_logs").insert({
        user_id: cleanId,
        action: "STUDY_SESSION",
        details: hasGrammarScore
          ? JSON.stringify({ grammarScore: Number(grammarScore), totalQuestions: Number(totalQuestions) })
          : null,
        duration_seconds: cleanDuration,
        timestamp,
      });
      if (activityError) throw activityError;

      let highestScore = null;
      if (hasGrammarScore) {
        const { data: current, error: grammarSelectError } = await supabase
          .from("grammar_progress")
          .select("highest_score, total_questions")
          .eq("user_id", cleanId)
          .maybeSingle();
        if (grammarSelectError) throw grammarSelectError;

        const currentPercent = Number(grammarScore) / Number(totalQuestions);
        const previousPercent = current?.total_questions
          ? Number(current.highest_score || 0) / Number(current.total_questions)
          : -1;
        if (currentPercent > previousPercent) {
          const { error: grammarUpsertError } = await supabase
            .from("grammar_progress")
            .upsert({
              user_id: cleanId,
              highest_score: Number(grammarScore),
              total_questions: Number(totalQuestions),
              updated_at: timestamp,
            }, { onConflict: "user_id" });
          if (grammarUpsertError) throw grammarUpsertError;
          highestScore = {
            score: Number(grammarScore),
            total: Number(totalQuestions),
            percent: Math.round(currentPercent * 100),
            achievedAt: timestamp,
          };
        } else if (current) {
          highestScore = {
            score: current.highest_score,
            total: current.total_questions,
            percent: Math.round(previousPercent * 100),
          };
        }
      }

      return {
        data: {
          success: true,
          data: {
            durationSeconds: cleanDuration,
            highestGrammarScore: highestScore,
          },
        },
      };
    }

    // 7. Upload Single Word
    if (url === "/vocabulary") {
      const { word, pos, banglaMeaning, synonyms, exampleUsage, topic, targetTab = "active", uploadedBy, userId } = body;
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
        target_tab: targetTab,
        uploaded_by: resolvedUploader,
      };

      const { data } = await supabase.from("vocabularies").insert(newWord).select();

      await supabase.from("audit_logs").insert({
        user_id: userId,
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
      const {
        items,
        defaultTopic = "Uploaded",
        targetTab = "active",
        uploadedBy = "bulk-upload",
        userId,
        userName,
        userRole = "general",
      } = body;

      const isAdmin = userRole === "admin";

      // Validation 1: General users can only upload to the "uploaded" tab
      if (!isAdmin && targetTab !== "uploaded") {
        const err = new Error("General users are only permitted to import into the Uploaded tab.");
        err.response = { data: { success: false, message: err.message } };
        throw err;
      }

      // Validation 2: General users 200 words/day limit
      if (!isAdmin) {
        if (!items || items.length > 200) {
          const err = new Error("General users are limited to a maximum of 200 words per day.");
          err.response = { data: { success: false, message: err.message } };
          throw err;
        }

        if (userId) {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const { count, error: countErr } = await supabase
            .from("vocabularies")
            .select("*", { count: "exact", head: true })
            .ilike("uploaded_by", `%${userId}%`)
            .gte("created_at", startOfDay.toISOString());

          if (!countErr && typeof count === "number") {
            const uploadedToday = count;
            if (uploadedToday + items.length > 200) {
              const remaining = Math.max(0, 200 - uploadedToday);
              const err = new Error(
                `Daily limit exceeded. You have already uploaded ${uploadedToday} words today and have ${remaining} remaining (limit: 200 words/day).`
              );
              err.response = { data: { success: false, message: err.message } };
              throw err;
            }
          }
        }
      }

      const safeUserName = userName || (isAdmin ? "Admin" : "Candidate");
      const safeUserId = userId || (isAdmin ? "admin" : "anon");
      const resolvedUploader =
        uploadedBy && uploadedBy.includes(":") && uploadedBy.split(":").length >= 3
          ? uploadedBy
          : `${targetTab}:${safeUserId}:${safeUserName}`;

      const docs = (items || []).map((row) => ({
        word: row.word.trim(),
        pos: (row.pos || "Unknown").trim(),
        bangla_meaning: row.banglaMeaning.trim(),
        synonyms: Array.isArray(row.synonyms) ? row.synonyms : [],
        example_usage: (row.exampleUsage || "").trim(),
        topic: (row.topic || defaultTopic).trim(),
        target_tab: targetTab,
        uploaded_by: resolvedUploader,
      }));

      await supabase.from("vocabularies").insert(docs);
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: "VOCAB_BULK_UPLOAD",
        user_name: userName || uploadedBy || (isAdmin ? "Admin" : "Candidate"),
        access_id: userId || (isAdmin ? "ADMIN" : "STUDENT"),
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
