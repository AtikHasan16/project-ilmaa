import { supabase } from "./supabaseClient";
import { toCamel } from "./dataMappers";

export async function getGrammarStats() {
  const { data, error } = await supabase.from("grammar_questions").select("module");
  if (error) throw error;

  const byModule = {};
  for (const question of data || []) {
    const module = question.module || "general";
    byModule[module] = (byModule[module] || 0) + 1;
  }

  return {
    data: {
      success: true,
      totalCount: (data || []).length,
      byModule,
    },
  };
}

export async function getGrammarQuestions(params = {}) {
  let query = supabase.from("grammar_questions").select("*");
  const module = params.module;

  if (module && module !== "all" && module !== "mixed") {
    if (module === "modifiers-dangling" || module === "run-on-comma-splices") {
      query = query.or(
        `module.eq.${module},module.eq.modifiers-and-splices`,
      );
    } else {
      query = query.eq("module", module);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return {
    data: {
      success: true,
      count: (data || []).length,
      data: toCamel(data || []),
    },
  };
}
