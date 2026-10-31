import { supabase } from "./supabaseClient.js";
import { fireConfetti } from "../utils/confetti.js";

/**
 * Canonical catalog of achievements and milestones in Imlaa.
 */
export const BADGE_CATALOG = [
  {
    key: "first_word_mastered",
    title: "First Step",
    category: "Vocabulary",
    description: "Mastered your very first vocabulary word.",
    requirement: "1 word mastered",
    icon: "sparkles",
    tier: "bronze",
  },
  {
    key: "vocab_apprentice",
    title: "Vocab Apprentice",
    category: "Vocabulary",
    description: "Reached 10 mastered terms across active corpus sets.",
    requirement: "10 words mastered",
    icon: "book",
    tier: "bronze",
  },
  {
    key: "vocab_virtuoso",
    title: "Vocab Virtuoso",
    category: "Vocabulary",
    description: "Mastered 50 vocabulary words with zero spelling hesitation.",
    requirement: "50 words mastered",
    icon: "academic",
    tier: "silver",
  },
  {
    key: "century_club",
    title: "Century Club",
    category: "Vocabulary",
    description: "Achieved the milestone of 100 mastered vocabulary terms.",
    requirement: "100 words mastered",
    icon: "trophy",
    tier: "gold",
  },
  {
    key: "lexicon_legend",
    title: "Lexicon Legend",
    category: "Vocabulary",
    description: "Attained 250 mastered terms in the academic lexicon.",
    requirement: "250 words mastered",
    icon: "fire",
    tier: "platinum",
  },
  {
    key: "first_drill",
    title: "Drill Initiate",
    category: "Practice",
    description: "Launched and completed your first practice drill.",
    requirement: "1 drill completed",
    icon: "clock",
    tier: "bronze",
  },
  {
    key: "drill_champion",
    title: "Drill Champion",
    category: "Practice",
    description: "Completed 10 interactive spelling or flashcard drills.",
    requirement: "10 drills completed",
    icon: "trophy",
    tier: "silver",
  },
  {
    key: "corpus_conqueror",
    title: "Corpus Conqueror",
    category: "Mastery",
    description: "Achieved 100% completion in at least one full corpus set.",
    requirement: "1 corpus completed",
    icon: "check",
    tier: "silver",
  },
  {
    key: "corpus_polymath",
    title: "Corpus Polymath",
    category: "Mastery",
    description: "Finished 3 or more full vocabulary topic sets.",
    requirement: "3 corpus sets completed",
    icon: "academic",
    tier: "gold",
  },
  {
    key: "grammar_scholar",
    title: "Grammar Scholar",
    category: "Grammar",
    description: "Completed a comprehensive grammar assessment.",
    requirement: "Grammar score recorded",
    icon: "pencil",
    tier: "silver",
  },
  {
    key: "clean_slate",
    title: "Clean Slate",
    category: "Accuracy",
    description: "Cleared all active mistakes and errors down to zero.",
    requirement: "0 mistakes remaining with active study",
    icon: "heart",
    tier: "gold",
  },
  {
    key: "corpus_contributor",
    title: "Corpus Architect",
    category: "Community",
    description: "Uploaded a custom vocabulary corpus to your personal workspace.",
    requirement: "1 custom corpus uploaded",
    icon: "cloud",
    tier: "bronze",
  },
];

/**
 * Fetch unlocked badges for a given user.
 */
export async function fetchUserBadges(userId) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("user_badges")
      .select("badge_key, unlocked_at, metadata")
      .eq("user_id", userId);

    if (error) {
      // Fallback to local storage if table is not yet migrated in current environment
      console.warn("Could not query user_badges from PostgREST:", error.message);
      return getLocalFallbackBadges(userId);
    }

    return (data || []).map((row) => ({
      badgeKey: row.badge_key,
      unlockedAt: row.unlocked_at,
      metadata: row.metadata || {},
    }));
  } catch (err) {
    console.warn("Badge fetch error, using local fallback:", err);
    return getLocalFallbackBadges(userId);
  }
}

/**
 * Evaluate user metrics and award newly unlocked badges.
 */
export async function evaluateAndUnlockBadges({ user, metrics, corpusList }) {
  if (!user?.id || !metrics) return [];

  try {
    const existingBadges = await fetchUserBadges(user.id);
    const unlockedSet = new Set(existingBadges.map((b) => b.badgeKey));

    const newlyUnlockedKeys = [];

    // Check 1: First Word Mastered
    if (metrics.masteredWordsCount >= 1 && !unlockedSet.has("first_word_mastered")) {
      newlyUnlockedKeys.push("first_word_mastered");
    }

    // Check 2: Vocab Apprentice (10 words)
    if (metrics.masteredWordsCount >= 10 && !unlockedSet.has("vocab_apprentice")) {
      newlyUnlockedKeys.push("vocab_apprentice");
    }

    // Check 3: Vocab Virtuoso (50 words)
    if (metrics.masteredWordsCount >= 50 && !unlockedSet.has("vocab_virtuoso")) {
      newlyUnlockedKeys.push("vocab_virtuoso");
    }

    // Check 4: Century Club (100 words)
    if (metrics.masteredWordsCount >= 100 && !unlockedSet.has("century_club")) {
      newlyUnlockedKeys.push("century_club");
    }

    // Check 5: Lexicon Legend (250 words)
    if (metrics.masteredWordsCount >= 250 && !unlockedSet.has("lexicon_legend")) {
      newlyUnlockedKeys.push("lexicon_legend");
    }

    // Check 6: Drill Initiate (1 drill)
    if (metrics.totalPracticeSessions >= 1 && !unlockedSet.has("first_drill")) {
      newlyUnlockedKeys.push("first_drill");
    }

    // Check 7: Drill Champion (10 drills)
    if (metrics.totalPracticeSessions >= 10 && !unlockedSet.has("drill_champion")) {
      newlyUnlockedKeys.push("drill_champion");
    }

    // Check 8: Corpus Conqueror (1 complete set)
    if (metrics.completedCorpusCount >= 1 && !unlockedSet.has("corpus_conqueror")) {
      newlyUnlockedKeys.push("corpus_conqueror");
    }

    // Check 9: Corpus Polymath (3 complete sets)
    if (metrics.completedCorpusCount >= 3 && !unlockedSet.has("corpus_polymath")) {
      newlyUnlockedKeys.push("corpus_polymath");
    }

    // Check 10: Grammar Scholar
    if (metrics.grammarScore && metrics.grammarScore.score > 0 && !unlockedSet.has("grammar_scholar")) {
      newlyUnlockedKeys.push("grammar_scholar");
    }

    // Check 11: Clean Slate (has studied words, 0 mistakes)
    if (
      metrics.masteredWordsCount >= 10 &&
      metrics.totalMistakesCount === 0 &&
      !unlockedSet.has("clean_slate")
    ) {
      newlyUnlockedKeys.push("clean_slate");
    }

    // Check 12: Corpus Architect (uploaded a corpus)
    const hasUploaded = (corpusList || []).some((c) => c.category === "Uploaded");
    if (hasUploaded && !unlockedSet.has("corpus_contributor")) {
      newlyUnlockedKeys.push("corpus_contributor");
    }

    if (newlyUnlockedKeys.length === 0) {
      return [];
    }

    const now = new Date().toISOString();
    const rowsToInsert = newlyUnlockedKeys.map((key) => ({
      user_id: user.id,
      badge_key: key,
      unlocked_at: now,
      metadata: { unlockedVia: "automatic_eval" },
    }));

    // Insert into Supabase PostgREST
    const { error } = await supabase.from("user_badges").insert(rowsToInsert);
    if (error) {
      console.warn("Supabase user_badges insert notice:", error.message);
      // Save locally so the user still enjoys their badges
      saveLocalFallbackBadges(user.id, newlyUnlockedKeys);
    }

    // Trigger celebratory confetti burst!
    fireConfetti({ particleCount: 90, spread: 70, origin: { x: 0.5, y: 0.5 } });

    return newlyUnlockedKeys.map((key) => {
      const def = BADGE_CATALOG.find((b) => b.key === key);
      return {
        badgeKey: key,
        unlockedAt: now,
        title: def?.title || key,
        description: def?.description || "",
      };
    });
  } catch (err) {
    console.warn("Badge evaluation error:", err);
    return [];
  }
}

function getLocalFallbackBadges(userId) {
  try {
    const raw = localStorage.getItem(`imlaa_badges_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFallbackBadges(userId, newKeys) {
  try {
    const existing = getLocalFallbackBadges(userId);
    const existingKeys = new Set(existing.map((b) => b.badgeKey));
    const now = new Date().toISOString();
    newKeys.forEach((k) => {
      if (!existingKeys.has(k)) {
        existing.push({ badgeKey: k, unlockedAt: now });
      }
    });
    localStorage.setItem(`imlaa_badges_${userId}`, JSON.stringify(existing));
  } catch {
    // ignore
  }
}
