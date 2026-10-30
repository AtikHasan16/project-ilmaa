import { supabase } from "./supabaseClient";
import { requireSupabaseUserId, toCamel } from "./dataMappers";
import { queryCache, invalidateAuditCache, invalidateProfileCache } from "./queryCache";

export async function getActiveUserCount() {
  const { data, error } = await supabase.rpc("get_active_user_count");
  if (error) throw error;
  return { data: { success: true, activeNowCount: Number(data) || 0 } };
}

export async function getAdminUsersAudit(params = {}) {
  const bypassCache = Boolean(params.bypassCache);
  const cacheKey = "audit:users:all";

  const fetcher = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) throw error;

    const users = (data || []).map((profile) => {
      const lastSeen = profile.last_active_at
        ? new Date(profile.last_active_at).getTime()
        : 0;
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role || "general",
        status: "approved",
        avatarUrl: profile.avatar_url,
        authProvider: profile.auth_provider || "email",
        deviceInfo: profile.device_info || {},
        createdAt: profile.created_at,
        lastActiveAt: profile.last_active_at,
        isOnline: Date.now() - lastSeen < 5 * 60 * 1000,
      };
    });

    return {
      data: {
        success: true,
        totalRegistered: users.length,
        approvedCount: users.length,
        activeNowCount: users.filter((user) => user.isOnline).length,
        users,
        data: users,
      },
    };
  };

  if (bypassCache) {
    queryCache.delete(cacheKey);
    return fetcher();
  }

  return queryCache.fetch(cacheKey, fetcher, 30000); // 30s TTL
}

export async function updateUserRole(body = {}) {
  const userId = requireSupabaseUserId(body.userId);
  const { data, error } = await supabase.rpc("admin_update_profile_role", {
    p_target_user_id: userId,
    p_role: body.role,
  });
  if (error) throw error;
  if (!data?.id || !["general", "admin"].includes(data.role)) {
    throw new Error("The role-update RPC returned an invalid profile.");
  }
  queryCache.delete("audit:users:all");
  invalidateProfileCache();
  invalidateAuditCache();
  return { data: { success: true, data: toCamel(data) } };
}

export async function getUserProfileMetrics(params = {}) {
  const userId = requireSupabaseUserId(params.userId);
  const [
    { data: spellingRows, error: spellingError },
    { data: flashcardRows, error: flashcardError },
    { data: activityRows, error: activityError },
    { data: grammarData, error: grammarError },
    { count: totalVocab, error: vocabError },
  ] = await Promise.all([
    supabase
      .from("spelling_progress")
      .select("mastered_words, incorrect_words")
      .eq("user_id", userId),
    supabase
      .from("flashcard_progress")
      .select("known_words, unknown_words, forgot_words")
      .eq("user_id", userId),
    supabase
      .from("user_activity_logs")
      .select("duration_seconds")
      .eq("user_id", userId)
      .eq("action", "STUDY_SESSION"),
    supabase
      .from("grammar_progress")
      .select("highest_score, total_questions")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("vocabularies").select("*", { count: "exact", head: true }),
  ]);

  const queryError =
    spellingError || flashcardError || activityError || grammarError || vocabError;
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

  const totalSessions =
    (activityRows || []).length || (masteredWords.size > 0 ? 1 : 0);
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
          ? Math.round(
              (grammarData.highest_score / grammarData.total_questions) * 100,
            )
          : 0,
      }
    : null;

  return {
    data: {
      success: true,
      data: {
        totalVocabInCorpus: totalVocab ?? 0,
        masteredCount: masteredWords.size,
        inProgressCount: inProgressWords.size,
        totalSessions,
        totalStudySeconds,
        highestGrammarScore,
      },
    },
  };
}
