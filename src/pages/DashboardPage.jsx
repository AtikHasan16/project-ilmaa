import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";
import { supabase } from "../services/supabaseClient";
import { toCamel } from "../services/dataMappers";
import {
  HiBookOpen,
  HiPencilSquare,
  HiAcademicCap,
  HiCloudArrowUp,
  HiCheckCircle,
  HiExclamationCircle,
  HiClock,
  HiArrowPath,
  HiSparkles,
  HiTrophy,
  HiArrowRight,
  HiHeart,
  HiUser,
  HiArrowTopRightOnSquare,
} from "react-icons/hi2";

/**
 * Candidate Learning Dashboard
 * Root Route for Authenticated Workspace:
 * - Vocabulary Progress & Mastery
 * - Practice Sessions count & Time invested
 * - Corpus Sets completed & in-progress tracking
 * - Active spelling/flashcard mistakes directory & direct review triggers
 * - Grammar performance and module overview
 */
export default function DashboardPage() {
  const { user, role, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Aggregated Analytics State
  const [metrics, setMetrics] = useState({
    masteredWordsCount: 0,
    inProgressWordsCount: 0,
    totalVocabAvailable: 0,
    overallMasteryPct: 0,
    totalPracticeSessions: 0,
    totalStudySeconds: 0,
    completedCorpusCount: 0,
    inProgressCorpusCount: 0,
    totalCorpusSets: 0,
    totalMistakesCount: 0,
    flashcardMistakesCount: 0,
    spellingMistakesCount: 0,
    grammarScore: null,
  });

  // Detailed Corpus Sets Progress
  const [corpusList, setCorpusList] = useState([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch vocabulary stats (filtered by user ownership for uploaded corpus)
      const statsRes = await apiClient.get("/vocabulary/stats", {
        params: {
          userId: user.id,
          userRole: role || "general",
          userName: user.name,
        },
      });
      const vocabStats = statsRes.data || {};

      // 2. Fetch user progress across spelling, flashcard, grammar
      const [
        { data: rawSpellingRows },
        { data: rawFlashcardRows },
        { data: rawGrammarData },
      ] = await Promise.all([
        supabase.from("spelling_progress").select("*").eq("user_id", user.id),
        supabase.from("flashcard_progress").select("*").eq("user_id", user.id),
        supabase.from("grammar_progress").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      const spellingRows = toCamel(rawSpellingRows || []);
      const flashcardRows = toCamel(rawFlashcardRows || []);
      const grammarData = toCamel(rawGrammarData);

      // Maps of progress by topic
      const spellingByTopic = {};
      const uniqueSpellingMastered = new Set();
      const uniqueSpellingIncorrect = new Set();
      (spellingRows || []).forEach((row) => {
        spellingByTopic[row.topic] = row;
        (row.masteredWords || []).forEach((w) => uniqueSpellingMastered.add(w));
        (row.incorrectWords || []).forEach((w) => uniqueSpellingIncorrect.add(w));
      });

      const flashcardByTopic = {};
      const uniqueFlashcardKnown = new Set();
      const uniqueFlashcardMistakes = new Set();
      (flashcardRows || []).forEach((row) => {
        flashcardByTopic[row.topic] = row;
        (row.knownWords || []).forEach((w) => uniqueFlashcardKnown.add(w));
        (row.unknownWords || []).forEach((w) => uniqueFlashcardMistakes.add(w));
        (row.forgotWords || []).forEach((w) => uniqueFlashcardMistakes.add(w));
      });

      // Combine unique mastered & mistakes
      const allMastered = new Set([...uniqueSpellingMastered, ...uniqueFlashcardKnown]);
      const allMistakes = new Set([...uniqueSpellingIncorrect, ...uniqueFlashcardMistakes]);

      // Combine corpus sets (All Active + Listening + User's Uploaded)
      const combinedCorpus = [];
      let completedCorpus = 0;
      let inProgressCorpus = 0;
      let totalVocab = 0;

      // A. All Active Topics
      (vocabStats.activeTopics || []).forEach((act) => {
        const total = act.count ?? 0;
        totalVocab += total;
        const spProg = spellingByTopic[act.title];
        const fcProg = flashcardByTopic[act.title];

        const masteredInSet = new Set([
          ...(spProg?.masteredWords || []),
          ...(fcProg?.knownWords || []),
        ]).size;
        const mistakesInSet = new Set([
          ...(spProg?.incorrectWords || []),
          ...(fcProg?.unknownWords || []),
          ...(fcProg?.forgotWords || []),
        ]).size;

        const percent = total > 0 ? Math.min(100, Math.round((masteredInSet / total) * 100)) : 0;
        if (percent === 100) completedCorpus += 1;
        else if (percent > 0) inProgressCorpus += 1;

        combinedCorpus.push({
          title: act.title,
          category: "All Active",
          wordsCount: total,
          masteredCount: masteredInSet,
          mistakesCount: mistakesInSet,
          percent,
          status: percent === 100 ? "completed" : percent > 0 ? "in-progress" : "not-started",
        });
      });

      // B. Listening Topics
      (vocabStats.listeningTopics || []).forEach((lis) => {
        const total = lis.count || 0;
        totalVocab += total;
        const spProg = spellingByTopic[lis.title];
        const fcProg = flashcardByTopic[lis.title];

        const masteredInSet = new Set([
          ...(spProg?.masteredWords || []),
          ...(fcProg?.knownWords || []),
        ]).size;
        const mistakesInSet = new Set([
          ...(spProg?.incorrectWords || []),
          ...(fcProg?.unknownWords || []),
          ...(fcProg?.forgotWords || []),
        ]).size;

        const percent = total > 0 ? Math.min(100, Math.round((masteredInSet / total) * 100)) : 0;
        if (percent === 100) completedCorpus += 1;
        else if (percent > 0) inProgressCorpus += 1;

        combinedCorpus.push({
          title: lis.title,
          category: "Listening",
          wordsCount: total,
          masteredCount: masteredInSet,
          mistakesCount: mistakesInSet,
          percent,
          status: percent === 100 ? "completed" : percent > 0 ? "in-progress" : "not-started",
        });
      });

      // C. Uploaded Topics (only user's uploaded sets for general, all for admin)
      (vocabStats.uploadedTopics || []).forEach((up) => {
        const total = up.count || 0;
        totalVocab += total;
        const spProg = spellingByTopic[up.title];
        const fcProg = flashcardByTopic[up.title];

        const masteredInSet = new Set([
          ...(spProg?.masteredWords || []),
          ...(fcProg?.knownWords || []),
        ]).size;
        const mistakesInSet = new Set([
          ...(spProg?.incorrectWords || []),
          ...(fcProg?.unknownWords || []),
          ...(fcProg?.forgotWords || []),
        ]).size;

        const percent = total > 0 ? Math.min(100, Math.round((masteredInSet / total) * 100)) : 0;
        if (percent === 100) completedCorpus += 1;
        else if (percent > 0) inProgressCorpus += 1;

        combinedCorpus.push({
          title: up.title,
          category: "Uploaded",
          uploaderName: up.uploaderName || (isAdmin ? "Admin" : (user.name || "You")),
          wordsCount: total,
          masteredCount: masteredInSet,
          mistakesCount: mistakesInSet,
          percent,
          status: percent === 100 ? "completed" : percent > 0 ? "in-progress" : "not-started",
        });
      });

      const totalPractices =
        (spellingRows?.length || 0) +
        (flashcardRows?.length || 0) +
        (grammarData?.testsTaken || (grammarData?.highestScore ? 1 : 0));

      const totalStudySeconds = allMastered.size * 35 + allMistakes.size * 25;
      const overallMastery = totalVocab > 0 ? Math.min(100, Math.round((allMastered.size / totalVocab) * 100)) : 0;

      if (!isMountedRef.current) return;

      setMetrics({
        masteredWordsCount: allMastered.size,
        inProgressWordsCount: allMistakes.size,
        totalVocabAvailable: totalVocab,
        overallMasteryPct: overallMastery,
        totalPracticeSessions: totalPractices || (allMastered.size > 0 ? 1 : 0),
        totalStudySeconds,
        completedCorpusCount: completedCorpus,
        inProgressCorpusCount: inProgressCorpus,
        totalCorpusSets: combinedCorpus.length,
        totalMistakesCount: allMistakes.size,
        flashcardMistakesCount: uniqueFlashcardMistakes.size,
        spellingMistakesCount: uniqueSpellingIncorrect.size,
        grammarScore: grammarData?.highestScore
          ? { score: grammarData.highestScore, total: grammarData.totalQuestions || 0 }
          : null,
      });

      setCorpusList(combinedCorpus);
    } catch (err) {
      if (isMountedRef.current) {
        console.warn("Could not load dashboard data:", err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user, role, isAdmin]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatStudyTime = (seconds) => {
    if (!seconds || seconds <= 0) return "0 min";
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs} hrs`;
  };

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-slide-up pb-16">
      {/* ==================================================== */}
      {/* 1. Header Banner & Welcome                          */}
      {/* ==================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-plum uppercase tracking-wider mb-1">
            <HiSparkles className="w-4 h-4 text-plum" />
            <span>Candidate Learning Workspace</span>
            <span className="text-plum/40">•</span>
            <span>{todayFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-body-dark tracking-tight">
            Welcome back, {user?.name || "Candidate"}
          </h1>
          <p className="text-xs sm:text-base text-muted-label mt-1">
            Real-time vocabulary mastery, corpus completion, practice drill analytics, and active mistakes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh Learning Metrics"
            className="imlaa-btn-secondary py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-base space-x-1.5 min-h-11"
          >
            <HiArrowPath className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing || loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
          <Link
            to="/support-us"
            className="imlaa-btn-secondary py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-base space-x-1.5 text-plum hover:bg-plum/10 min-h-11"
          >
            <HiHeart className="w-4 h-4 sm:w-5 sm:h-5 text-plum shrink-0" />
            <span>Support Us</span>
          </Link>
          <span className="imlaa-badge text-xs sm:text-base py-1 px-3 sm:px-4 uppercase font-bold tracking-wider">
            {role || "general"} Member
          </span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. Primary KPI Metrics Grid                          */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Vocabulary Progress */}
        <div className="imlaa-card p-5 sm:p-6 border border-plum/20 bg-white flex flex-col justify-between space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between text-muted-label">
            <span className="text-xs font-bold uppercase tracking-wider text-plum">
              Vocabulary Mastery
            </span>
            <div className="w-9 h-9 rounded-xl bg-plum/10 text-plum flex items-center justify-center">
              <HiBookOpen className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-body-dark font-mono">
                {metrics.masteredWordsCount}
              </span>
              <span className="text-xs sm:text-sm text-muted-label font-medium">
                / {metrics.totalVocabAvailable} Words
              </span>
            </div>
            <div className="w-full bg-plum/10 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-plum transition-all duration-500"
                style={{ width: `${metrics.overallMasteryPct}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-muted-label flex items-center justify-between pt-2 border-t border-plum/10">
            <span>Overall Curriculum Mastery</span>
            <strong className="text-plum font-bold">{metrics.overallMasteryPct}%</strong>
          </div>
        </div>

        {/* Metric 2: Corpus Sets Completed */}
        <div className="imlaa-card p-5 sm:p-6 border border-plum/20 bg-white flex flex-col justify-between space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between text-muted-label">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Corpus Sets Completed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HiCheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono">
                {metrics.completedCorpusCount}
              </span>
              <span className="text-xs sm:text-sm text-muted-label font-medium">
                / {metrics.totalCorpusSets} Sets Done
              </span>
            </div>
            <div className="text-xs text-muted-label mt-2">
              {metrics.inProgressCorpusCount} in-progress, {Math.max(0, metrics.totalCorpusSets - metrics.completedCorpusCount - metrics.inProgressCorpusCount)} unstarted
            </div>
          </div>

          <div className="text-xs text-muted-label flex items-center justify-between pt-2 border-t border-plum/10">
            <span>Coverage</span>
            <strong className="text-emerald-700 font-bold">
              {metrics.totalCorpusSets > 0 ? Math.round((metrics.completedCorpusCount / metrics.totalCorpusSets) * 100) : 0}% 100% Mastered
            </strong>
          </div>
        </div>

        {/* Metric 3: Practice Drills Launched & Time */}
        <div className="imlaa-card p-5 sm:p-6 border border-plum/20 bg-white flex flex-col justify-between space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between text-muted-label">
            <span className="text-xs font-bold uppercase tracking-wider text-plum">
              Practice Drills
            </span>
            <div className="w-9 h-9 rounded-xl bg-plum/10 text-plum flex items-center justify-center">
              <HiClock className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-body-dark font-mono">
                {metrics.totalPracticeSessions}
              </span>
              <span className="text-xs sm:text-sm text-muted-label font-medium">
                Drills Launched
              </span>
            </div>
            <div className="text-xs text-muted-label mt-2">
              Total practice time: <strong className="text-body-dark">{formatStudyTime(metrics.totalStudySeconds)}</strong>
            </div>
          </div>

          <div className="text-xs text-muted-label flex items-center justify-between pt-2 border-t border-plum/10">
            <span>Active Study Time</span>
            <strong className="text-plum font-bold font-mono">{formatStudyTime(metrics.totalStudySeconds)}</strong>
          </div>
        </div>

        {/* Metric 4: Active Mistakes Needing Review */}
        <div className="imlaa-card p-5 sm:p-6 border border-rose-200 bg-rose-50/50 flex flex-col justify-between space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between text-muted-label">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Needs Review
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <HiExclamationCircle className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-rose-700 font-mono">
                {metrics.totalMistakesCount}
              </span>
              <span className="text-xs sm:text-sm text-rose-800 font-medium">
                Active Mistakes
              </span>
            </div>
            <div className="text-xs text-rose-700/80 mt-2">
              {metrics.spellingMistakesCount} spelling errors, {metrics.flashcardMistakesCount} flashcards
            </div>
          </div>

          <div className="text-xs text-rose-800 flex items-center justify-between pt-2 border-t border-rose-200">
            <span>Reinforce Weak Words</span>
            {metrics.totalMistakesCount > 0 ? (
              <button
                type="button"
                onClick={() => navigate("/workspace/flashcard")}
                className="font-bold underline hover:text-rose-900 cursor-pointer"
              >
                Review Now &rarr;
              </button>
            ) : (
              <span className="font-semibold text-emerald-700">All Clear!</span>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. Mistakes Action Callout Banner                    */}
      {/* ==================================================== */}
      {metrics.totalMistakesCount > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl border border-rose-300 bg-rose-50/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-rose-800 font-bold text-base sm:text-lg">
              <HiExclamationCircle className="w-5 h-5 shrink-0" />
              <span>You have {metrics.totalMistakesCount} vocabulary terms that need review</span>
            </div>
            <p className="text-xs sm:text-sm text-rose-700 max-w-2xl leading-relaxed">
              Drilling words you previously got wrong reinforces long-term retention and is the most effective way to improve your IELTS Academic spelling and lexicon accuracy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {metrics.flashcardMistakesCount > 0 && (
              <button
                type="button"
                onClick={() => navigate("/workspace/flashcard")}
                className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer min-h-11 flex items-center space-x-1.5"
              >
                <HiBookOpen className="w-4 h-4" />
                <span>Review Flashcards ({metrics.flashcardMistakesCount})</span>
              </button>
            )}

            {metrics.spellingMistakesCount > 0 && (
              <button
                type="button"
                onClick={() => navigate("/workspace/spelling")}
                className="px-4 py-2 rounded-xl bg-rose-700 text-white hover:bg-rose-800 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer min-h-11 flex items-center space-x-1.5"
              >
                <HiPencilSquare className="w-4 h-4" />
                <span>Fix Spelling Errors ({metrics.spellingMistakesCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. Interactive Learning Modules Overview             */}
      {/* ==================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-body-dark">
            Learning Modules & Practice Drills
          </h2>
          <span className="text-xs text-muted-label">3 Active Drill Types</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Module 1: Flashcards */}
          <div className="imlaa-card p-6 border border-plum/20 bg-white flex flex-col justify-between space-y-5 hover:shadow-md transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-plum/10 text-plum flex items-center justify-center">
                  <HiBookOpen className="w-6 h-6" />
                </div>
                <span className="imlaa-badge text-xs">Flashcards</span>
              </div>
              <h3 className="text-lg font-bold text-body-dark">Flashcards Drill</h3>
              <p className="text-xs sm:text-sm text-muted-label leading-relaxed">
                Flip card exercises with Bengali meanings, example usage, audio pronunciation, and confidence tracking (Knew, Forgot, Didn&apos;t Know).
              </p>
            </div>

            <div className="pt-3 border-t border-plum/10 flex items-center justify-between">
              <span className="text-xs text-muted-label">
                {metrics.masteredWordsCount} Known terms
              </span>
              <button
                type="button"
                onClick={() => navigate("/workspace/flashcard")}
                className="imlaa-btn-primary py-2 px-4 text-xs font-semibold space-x-1.5 min-h-11"
              >
                <span>Study</span>
                <HiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 2: Spelling Dictation */}
          <div className="imlaa-card p-6 border border-plum/20 bg-white flex flex-col justify-between space-y-5 hover:shadow-md transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-plum/10 text-plum flex items-center justify-center">
                  <HiPencilSquare className="w-6 h-6" />
                </div>
                <span className="imlaa-badge text-xs">Spelling</span>
              </div>
              <h3 className="text-lg font-bold text-body-dark">Spelling Dictation</h3>
              <p className="text-xs sm:text-sm text-muted-label leading-relaxed">
                Listen to Edge-TTS voice audio, type the correct spelling, receive instant feedback, and eliminate common IELTS spelling errors.
              </p>
            </div>

            <div className="pt-3 border-t border-plum/10 flex items-center justify-between">
              <span className="text-xs text-muted-label">
                {metrics.spellingMistakesCount} Misspelled
              </span>
              <button
                type="button"
                onClick={() => navigate("/workspace/spelling")}
                className="imlaa-btn-primary py-2 px-4 text-xs font-semibold space-x-1.5 min-h-11"
              >
                <span>Practice</span>
                <HiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module 3: Grammar Drills */}
          <div className="imlaa-card p-6 border border-plum/20 bg-white flex flex-col justify-between space-y-5 hover:shadow-md transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-plum/10 text-plum flex items-center justify-center">
                  <HiAcademicCap className="w-6 h-6" />
                </div>
                <span className="imlaa-badge text-xs">Grammar</span>
              </div>
              <h3 className="text-lg font-bold text-body-dark">Grammar Drills</h3>
              <p className="text-xs sm:text-sm text-muted-label leading-relaxed">
                Tackle modifiers, comma splices, sentence structure, and complex punctuation with instant answer explanations.
              </p>
            </div>

            <div className="pt-3 border-t border-plum/10 flex items-center justify-between">
              <div className="text-xs text-muted-label flex items-center space-x-1">
                <HiTrophy className="w-4 h-4 text-amber-600" />
                <span>
                  {metrics.grammarScore
                    ? `${metrics.grammarScore.score}/${metrics.grammarScore.total}`
                    : "Not started"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/workspace/grammar")}
                className="imlaa-btn-primary py-2 px-4 text-xs font-semibold space-x-1.5 min-h-11"
              >
                <span>Drill</span>
                <HiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 5. Corpus Progress Directory (Real-time tracking)   */}
      {/* ==================================================== */}
      <div className="imlaa-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-plum/15">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold text-body-dark">
                Corpus Sets Progress Directory
              </h2>
              <span className="imlaa-badge text-xs">{corpusList.length} Sets</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-label mt-1">
              Detailed breakdown of your curriculum and custom uploaded corpus sets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/workspace/upload")}
            className="imlaa-btn-secondary py-2 px-3 text-xs sm:text-sm font-semibold space-x-1.5 min-h-11 self-start sm:self-auto"
          >
            <HiCloudArrowUp className="w-4 h-4 text-plum" />
            <span>Upload New Corpus</span>
          </button>
        </div>

        {/* Corpus Sets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {corpusList.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-plum/20 bg-plum/5 flex flex-col justify-between space-y-4 hover:shadow-sm transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-label">
                    {item.category}
                  </span>
                  {item.status === "completed" ? (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Completed
                    </span>
                  ) : item.status === "in-progress" ? (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-plum/10 text-plum border border-plum/20">
                      In Progress
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-200/80 text-stone-700 border border-stone-300">
                      Not Started
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-body-dark leading-snug">
                  {item.title}
                </h3>

                {/* Uploader / Tag */}
                {item.category === "Uploaded" ? (
                  <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-white text-plum text-xs font-semibold border border-plum/15">
                    <HiUser className="w-3.5 h-3.5 text-plum" />
                    <span>Uploaded by {item.uploaderName || user?.name || "You"}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-white text-stone-700 text-xs font-semibold border border-stone-200">
                    <HiAcademicCap className="w-3.5 h-3.5 text-plum" />
                    <span>Curriculum Corpus</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-plum/10">
                <div className="flex items-center justify-between text-xs text-muted-label">
                  <span>Progress ({item.masteredCount} / {item.wordsCount} words)</span>
                  <span className="font-bold text-body-dark">{item.percent}%</span>
                </div>
                <div className="w-full bg-plum/15 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-plum transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {item.mistakesCount > 0 ? (
                    <span className="text-xs font-bold text-rose-600">
                      {item.mistakesCount} Needs Review
                    </span>
                  ) : (
                    <span className="text-xs text-muted-label">
                      {item.wordsCount} Total terms
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate("/workspace/flashcard")}
                    className="imlaa-btn-secondary py-1.5 px-3 text-xs font-bold text-plum space-x-1"
                  >
                    <span>Study</span>
                    <HiArrowTopRightOnSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 6. Quick Action Links & Profile Hub                  */}
      {/* ==================================================== */}
      <div className="p-6 rounded-2xl border border-plum/20 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-bold text-body-dark">
            Need to update account credentials or photo?
          </h3>
          <p className="text-xs sm:text-sm text-muted-label">
            Manage your candidate profile, registered device, and account security credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/workspace/profile")}
          className="imlaa-btn-secondary py-2.5 px-5 text-xs sm:text-sm font-semibold space-x-2 min-h-11 shrink-0"
        >
          <HiUser className="w-4 h-4 text-plum" />
          <span>Go to Profile</span>
        </button>
      </div>
    </div>
  );
}
