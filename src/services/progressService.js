import { supabase } from "./supabaseClient";
import { requireSupabaseUserId, toCamel } from "./dataMappers";

async function fallbackRecordSpelling({ p_topic, p_word, p_is_correct, p_last_index }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Authentication is required to save progress");

  const { data: existing } = await supabase
    .from("spelling_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("topic", p_topic)
    .maybeSingle();

  const mastered = new Set(existing?.mastered_words || []);
  const incorrect = new Set(existing?.incorrect_words || []);

  if (p_is_correct) {
    mastered.add(p_word);
    incorrect.delete(p_word);
  } else {
    incorrect.add(p_word);
    mastered.delete(p_word);
  }

  const payload = {
    user_id: user.id,
    topic: p_topic,
    mastered_words: [...mastered],
    incorrect_words: [...incorrect],
    last_index: Math.max(0, p_last_index || 0),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("spelling_progress")
    .upsert(payload, { onConflict: "user_id,topic" })
    .select()
    .single();

  if (error) throw error;
  return {
    masteredWords: data.mastered_words,
    incorrectWords: data.incorrect_words,
    lastIndex: data.last_index,
  };
}

async function fallbackRecordFlashcard({ p_topic, p_word, p_status, p_last_index }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Authentication is required to save progress");

  const { data: existing } = await supabase
    .from("flashcard_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("topic", p_topic)
    .maybeSingle();

  const known = new Set(existing?.known_words || []);
  const unknown = new Set(existing?.unknown_words || []);
  const forgot = new Set(existing?.forgot_words || []);

  known.delete(p_word);
  unknown.delete(p_word);
  forgot.delete(p_word);

  if (p_status === "knew") known.add(p_word);
  else if (p_status === "forgot") forgot.add(p_word);
  else unknown.add(p_word);

  const payload = {
    user_id: user.id,
    topic: p_topic,
    known_words: [...known],
    unknown_words: [...unknown],
    forgot_words: [...forgot],
    last_index: Math.max(0, p_last_index || 0),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("flashcard_progress")
    .upsert(payload, { onConflict: "user_id,topic" })
    .select()
    .single();

  if (error) throw error;
  return {
    knownWords: data.known_words,
    unknownWords: data.unknown_words,
    forgotWords: data.forgot_words,
    lastIndex: data.last_index,
  };
}

async function callProgressRpc(functionName, parameters) {
  try {
    const { data, error } = await supabase.rpc(functionName, parameters);
    if (!error && data && typeof data === "object") {
      return data;
    }
    if (error && error.code !== "PGRST202") {
      throw error;
    }
  } catch (rpcErr) {
    if (rpcErr.code !== "PGRST202" && !rpcErr.message?.includes("schema cache") && !rpcErr.message?.includes("404")) {
      throw rpcErr;
    }
  }

  // Graceful fallback to table-level upsert if RPC is missing
  if (functionName === "record_spelling_result") {
    return fallbackRecordSpelling(parameters);
  } else if (functionName === "record_flashcard_result") {
    return fallbackRecordFlashcard(parameters);
  }

  throw new Error(`The ${functionName} RPC returned an invalid progress result.`);
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

export async function getVocabularyProgress(params = {}) {
  const userId = params.userId;
  if (!userId) return { data: { success: false, data: null } };

  const record = await loadVocabularyProgress(requireSupabaseUserId(userId));
  return { data: { success: true, data: record } };
}

export async function getFlashcardProgress(params = {}) {
  const userId = params.userId;
  const topic = params.topic || "Academic Word List: Sublist A";
  if (!userId) {
    return {
      data: {
        success: false,
        data: { knownWords: [], unknownWords: [], forgotWords: [], lastIndex: 0 },
      },
    };
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
      data: toCamel(
        data || {
          known_words: [],
          unknown_words: [],
          forgot_words: [],
          last_index: 0,
        },
      ),
    },
  };
}

export async function getSpellingProgress(params = {}) {
  const userId = params.userId;
  const topic = params.topic || "Academic Word List: Sublist A";
  if (!userId) {
    return {
      data: {
        success: false,
        data: { masteredWords: [], incorrectWords: [], lastIndex: 0 },
      },
    };
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
      data: toCamel(
        data || {
          mastered_words: [],
          incorrect_words: [],
          last_index: 0,
        },
      ),
    },
  };
}

export async function recordVocabularyProgress(body = {}) {
  const {
    userId,
    word,
    isCorrect,
    topic = "Academic Word List: Sublist A",
    currentIndex = 0,
  } = body;
  const cleanId = requireSupabaseUserId(userId);
  const cleanWord = String(word || "").trim();
  if (!cleanWord) throw new Error("A word is required to record spelling progress.");

  await callProgressRpc("record_spelling_result", {
    p_topic: topic,
    p_word: cleanWord,
    p_is_correct: isCorrect,
    p_last_index: Math.max(0, Number.parseInt(currentIndex, 10) || 0),
  });

  return {
    data: { success: true, data: await loadVocabularyProgress(cleanId) },
  };
}

export async function resetVocabularyProgress(body = {}) {
  const cleanId = requireSupabaseUserId(body.userId);
  let query = supabase.from("spelling_progress").delete().eq("user_id", cleanId);
  if (body.topic) query = query.eq("topic", body.topic);
  const { error } = await query;
  if (error) throw error;
  return { data: { success: true, message: "Progress reset successfully" } };
}

export async function recordFlashcardProgress(body = {}) {
  const {
    userId,
    topic = "Academic Word List: Sublist A",
    word,
    status,
    lastIndex = 0,
  } = body;
  requireSupabaseUserId(userId);
  const cleanWord = String(word || "").trim();
  if (!cleanWord) throw new Error("A word is required to record flashcard progress.");

  const progress = await callProgressRpc("record_flashcard_result", {
    p_topic: topic,
    p_word: cleanWord,
    p_status: ["knew", "forgot", "unknown"].includes(status)
      ? status
      : "unknown",
    p_last_index: Math.max(0, Number.parseInt(lastIndex, 10) || 0),
  });

  return {
    data: { success: true, data: progress },
  };
}

export async function resetFlashcardProgress(body = {}) {
  const { userId, topic } = body;
  const targetUserId = requireSupabaseUserId(userId);
  if (topic) {
    const { error } = await supabase
      .from("flashcard_progress")
      .delete()
      .eq("user_id", targetUserId)
      .eq("topic", topic);
    if (error) throw error;
  }
  return { data: { success: true, message: "Flashcard progress reset" } };
}

export async function recordSpellingProgress(body = {}) {
  const {
    userId,
    topic = "Academic Word List: Sublist A",
    word,
    isCorrect,
    lastIndex = 0,
  } = body;
  requireSupabaseUserId(userId);
  const cleanWord = String(word || "").trim();
  if (!cleanWord) throw new Error("A word is required to record spelling progress.");

  const progress = await callProgressRpc("record_spelling_result", {
    p_topic: topic,
    p_word: cleanWord,
    p_is_correct: isCorrect,
    p_last_index: Math.max(0, Number.parseInt(lastIndex, 10) || 0),
  });

  return {
    data: { success: true, data: progress },
  };
}

export async function resetSpellingProgress(body = {}) {
  const { userId, topic } = body;
  const targetUserId = requireSupabaseUserId(userId);
  if (topic) {
    const { error } = await supabase
      .from("spelling_progress")
      .delete()
      .eq("user_id", targetUserId)
      .eq("topic", topic);
    if (error) throw error;
  }
  return { data: { success: true, message: "Spelling progress reset" } };
}
