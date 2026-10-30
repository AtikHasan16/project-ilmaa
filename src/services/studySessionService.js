import { supabase } from "./supabaseClient";

export async function recordStudySession(body = {}) {
  const { durationSeconds = 0, grammarScore = null, totalQuestions = null } = body;
  const cleanDuration = Math.max(0, Number.parseInt(durationSeconds, 10) || 0);
  const cleanGrammarScore =
    grammarScore === null || grammarScore === undefined
      ? null
      : Number(grammarScore);
  const cleanTotalQuestions =
    totalQuestions === null || totalQuestions === undefined
      ? null
      : Number(totalQuestions);
  if (
    (cleanGrammarScore !== null && !Number.isInteger(cleanGrammarScore)) ||
    (cleanTotalQuestions !== null && !Number.isInteger(cleanTotalQuestions))
  ) {
    throw new Error("Grammar score and question count must be whole numbers.");
  }

  const { data, error } = await supabase.rpc("record_study_session", {
    p_duration_seconds: cleanDuration,
    p_grammar_score: cleanGrammarScore,
    p_total_questions: cleanTotalQuestions,
  });
  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error("The study-session RPC returned an invalid result.");
  }

  return {
    data: { success: true, data },
  };
}
