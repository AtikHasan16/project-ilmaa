import { supabase } from "./supabaseClient";
import { requireSupabaseUserId, toCamel } from "./dataMappers";

async function callProgressRpc(functionName, parameters) {
  const { data, error } = await supabase.rpc(functionName, parameters);
  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error(`The ${functionName} RPC returned an invalid progress result.`);
  }
  return data;
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
