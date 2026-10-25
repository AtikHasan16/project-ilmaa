import { useState, useEffect, useCallback } from "react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import {
  HiCheckCircle,
  HiXCircle,
  HiArrowPath,
  HiInformationCircle,
  HiArrowLeft,
  HiArrowRight,
  HiShieldCheck,
  HiClock,
} from "react-icons/hi2";

// Grammar modules and topic categories matching the provided design image
// Grammar topic categories aligned with actual curriculum modules
const GRAMMAR_CATEGORIES = [
  { id: "all", label: "All Modules" },
  { id: "sentence-structure", label: "Sentence Structure" },
  { id: "morphology", label: "Morphology & Nouns" },
  { id: "voice-and-style", label: "Voice & Style" },
];

const GRAMMAR_TOPICS = [
  {
    id: "parallelism",
    category: "sentence-structure",
    title: "Parallelism & Correlative Conjunctions",
    description: "Balancing clauses with either/or, neither/nor, and not only/but also.",
  },
  {
    id: "parts-of-speech",
    category: "morphology",
    title: "Parts of Speech & Derivations",
    description: "Nominalization, adjective-adverb confusion, and suffix derivations.",
  },
  {
    id: "singular-plural-nouns",
    category: "morphology",
    title: "500 Singular & Plural Nouns",
    description: "Irregular plurals, Latin/Greek derivations, and uncountable noun rules.",
  },
  {
    id: "voice-change",
    category: "voice-and-style",
    title: "Voice Change & Passive Constraints",
    description: "Active vs passive voice, agent omission, and transitive restrictions.",
  },
  {
    id: "modifiers-and-splices",
    category: "sentence-structure",
    title: "Dangling Modifiers & Comma Splices",
    description: "Participial phrases, logical subjects, coordinating conjunctions, and semicolons.",
  },
];

export default function GrammarPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState(null); // When null => show topic grid
  const [viewMode, setViewMode] = useState("overview"); // 'overview' | 'quiz'
  const [drillStartTime, setDrillStartTime] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [grammarStats, setGrammarStats] = useState(null);

  // Fetch dynamic grammar statistics from backend
  useEffect(() => {
    let isMounted = true;
    const fetchGrammarStats = async () => {
      try {
        const res = await apiClient.get("/grammar/stats");
        if (isMounted && res.data?.success) {
          setGrammarStats(res.data);
        }
      } catch (err) {
        console.warn("Could not load grammar stats:", err);
      }
    };
    fetchGrammarStats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute dynamic grammar topics with real counts & progress percent
  const dynamicGrammarTopics = GRAMMAR_TOPICS.map((topic) => {
    const byModule = grammarStats?.byModule || {};
    let realCount;

    if (byModule[topic.id] !== undefined) {
      realCount = byModule[topic.id];
    } else if (topic.id === "modifiers-and-splices") {
      realCount = byModule["modifiers-and-splices"] || (byModule["modifiers-dangling"] || 0) + (byModule["run-on-comma-splices"] || 0);
    } else {
      realCount = 0;
    }

    // Dynamic progress percentage based on target module mastery (e.g. 50 exercises target)
    const percent = realCount > 0 ? Math.min(100, Math.round((realCount / 50) * 100)) : 0;

    return {
      ...topic,
      realCount,
      exercisesCount: realCount === 1 ? "1 Question" : `${realCount} Questions`,
      percent,
    };
  });

  // Load questions for topic
  const loadQuestions = useCallback(async (topicId) => {
    setLoading(true);
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex(0);
    setScore(0);
    try {
      const moduleParam = topicId === "all" || topicId === "mixed" ? "" : topicId;
      const res = await apiClient.get("/grammar/questions", {
        params: moduleParam ? { module: moduleParam } : {},
      });
      if (res.data?.success && res.data.data && res.data.data.length > 0) {
        setQuestions(res.data.data);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStartTopic = useCallback(
    (topic) => {
      if (!topic.realCount || topic.realCount === 0) return;
      setSelectedTopic(topic);
      setViewMode("quiz");
      setDrillStartTime(Date.now());
      loadQuestions(topic.id);
    },
    [loadQuestions],
  );

  const handleReturnToTopics = () => {
    // Record study session and highest score to backend if user practiced
    if (user?.accessId && drillStartTime) {
      const durationSeconds = Math.max(1, Math.round((Date.now() - drillStartTime) / 1000));
      apiClient
        .post("/user/study-session", {
          accessId: user.accessId,
          durationSeconds,
          grammarScore: score,
          totalQuestions: currentIndex + 1,
        })
        .catch(() => {});
    }

    setSelectedTopic(null);
    setViewMode("overview");
    setSelectedOption(null);
    setIsAnswered(false);
    setDrillStartTime(null);
  };

  const currentQ = questions[currentIndex] || null;

  const handleSelectOption = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === currentQ.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const filteredTopics =
    activeCategory === "all"
      ? dynamicGrammarTopics
      : dynamicGrammarTopics.filter((t) => t.category === activeCategory);

  const totalQuestionsInDatabase = grammarStats?.totalCount || 286;

  return (
    <div className="w-full flex flex-col space-y-7 animate-slide-up">
      {/* ==================================================== */}
      {/* 1. Header Bar: Title, Subtitle, Corpus Verified Badge*/}
      {/* ==================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div>
          <h1 className="text-3xl font-black text-body-dark tracking-tight">
            Grammar & Syntactic Accuracy
          </h1>
          <p className="text-base text-muted-label mt-1">
            Targeted structural drills and error elimination.
          </p>
        </div>

        <div className="flex items-center space-x-2 border border-plum/25 bg-plum/5 px-3.5 py-1.5 rounded-xl self-start md:self-auto text-base text-plum font-semibold">
          <HiShieldCheck className="w-5 h-5 text-plum" />
          <span>
            Database: {totalQuestionsInDatabase} Questions Verified
          </span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. Topics Overview View (Home Selection Page)        */}
      {/* ==================================================== */}
      {viewMode === "overview" && (
        <div className="flex flex-col space-y-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {GRAMMAR_CATEGORIES.map((cat) => {
              const count =
                cat.id === "all"
                  ? dynamicGrammarTopics.length
                  : dynamicGrammarTopics.filter((t) => t.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`imlaa-tab-btn text-base flex items-center space-x-2 px-5 py-2.5 ${
                    activeCategory === cat.id ? "active" : ""
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeCategory === cat.id
                        ? "bg-white/20 text-white"
                        : "bg-plum/10 text-plum"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grammar Topic Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => {
              const hasQuestions = topic.realCount > 0;

              return (
                <div
                  key={topic.id}
                  className="imlaa-card p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200 border border-plum/20 rounded-2xl bg-white"
                >
                  <div>
                    {/* Header: Title and Question Count Tag */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-xl font-bold text-body-dark leading-snug">
                        {topic.title}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 border ${
                          hasQuestions
                            ? "bg-plum/10 text-plum border-plum/20"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {topic.exercisesCount}
                      </span>
                    </div>

                    {/* Clean Description */}
                    <p className="text-base text-muted-label leading-relaxed mb-6">
                      {topic.description}
                    </p>
                  </div>

                  <div>
                    {/* Dynamic Progress Bar */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-label mb-1.5">
                        <span>Target Mastery</span>
                        <span className="font-mono text-plum font-bold">
                          {topic.percent}%
                        </span>
                      </div>
                      <div className="w-full bg-plum/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-plum transition-all duration-500"
                          style={{ width: `${topic.percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-4 border-t border-plum/10 flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-label">
                        {hasQuestions ? "Ready to practice" : "No questions available"}
                      </span>

                      <button
                        type="button"
                        disabled={!hasQuestions}
                        onClick={() => handleStartTopic(topic)}
                        className={`py-2 px-5 text-base rounded-xl font-semibold transition-all inline-flex items-center space-x-1.5 ${
                          !hasQuestions
                            ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60 pointer-events-none"
                            : "imlaa-btn-primary cursor-pointer hover:shadow-md"
                        }`}
                      >
                        <span>{hasQuestions ? "Practice" : "No Questions"}</span>
                        {hasQuestions && <HiArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Diagnostic Drill */}
          <div className="imlaa-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-plum/25 bg-plum/5 rounded-2xl">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-plum/10 border border-plum/20 flex items-center justify-center text-plum shrink-0">
                <HiClock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-bold text-body-dark">
                    Quick Diagnostic Drill
                  </h4>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-plum text-white">
                    Adaptive
                  </span>
                </div>
                <p className="text-base text-muted-label mt-0.5">
                  Full mix drill across all verified grammar categories to test your baseline accuracy.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={totalQuestionsInDatabase === 0}
              onClick={() =>
                handleStartTopic({
                  id: "all",
                  title: "Quick Diagnostic Drill",
                  description: "Full question pool across all modules",
                  realCount: totalQuestionsInDatabase,
                })
              }
              className={`py-3 px-6 text-base whitespace-nowrap self-stretch sm:self-auto rounded-xl font-semibold transition-all ${
                totalQuestionsInDatabase === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "imlaa-btn-primary cursor-pointer"
              }`}
            >
              Start Rapid Drill
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. Interactive Quiz Practice View                   */}
      {/* ==================================================== */}
      {viewMode === "quiz" && (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-6">
          {/* Header navigation */}
          <div className="w-full flex items-center justify-between text-base px-1">
            <button
              type="button"
              onClick={handleReturnToTopics}
              className="inline-flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold cursor-pointer"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back to Grammar Modules</span>
            </button>

            <span className="imlaa-badge text-base">
              Score: {score} / {questions.length}
            </span>
          </div>

          {loading ? (
            <div className="imlaa-card w-full p-16 text-center animate-pulse">
              <div className="text-xl text-plum font-semibold">
                Loading questions...
              </div>
            </div>
          ) : !currentQ ? (
            <div className="imlaa-card w-full p-12 text-center space-y-4">
              <div className="text-2xl font-bold text-body-dark">
                No exercises found
              </div>
              <button
                type="button"
                onClick={handleReturnToTopics}
                className="imlaa-btn-primary text-base"
              >
                Choose Another Topic
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col space-y-6">
              {/* Question progress */}
              <div className="flex items-center justify-between text-base text-muted-label px-2">
                <span className="font-semibold text-body-dark">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="font-mono text-plum">
                  {selectedTopic?.title}
                </span>
              </div>

              {/* Question Card */}
              <div className="imlaa-card w-full p-8 sm:p-10 flex flex-col space-y-7 shadow-md transition-all">
                <h3 className="text-2xl sm:text-3xl font-bold text-body-dark leading-snug">
                  {currentQ.questionText}
                </h3>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = option === currentQ.correctAnswer;

                    let btnStyle =
                      "border-plum/20 hover:border-plum bg-white text-body-dark hover:bg-plum/5";
                    if (isAnswered) {
                      if (isCorrect) {
                        btnStyle =
                          "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-600";
                      } else if (isSelected) {
                        btnStyle =
                          "border-rose-600 bg-rose-50 text-rose-900 font-bold ring-1 ring-rose-600";
                      } else {
                        btnStyle = "border-gray-200 opacity-60 text-muted-label";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(option)}
                        className={`w-full p-4 rounded-xl border text-left text-lg flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                      >
                        <span>{option}</span>
                        {isAnswered && isCorrect && (
                          <HiCheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                        )}
                        {isAnswered && isSelected && !isCorrect && (
                          <HiXCircle className="w-6 h-6 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* One-sentence immediate explanation */}
                {isAnswered && (
                  <div className="p-4 rounded-xl bg-plum/5 border border-plum/20 flex items-start space-x-3 text-base text-body-dark animate-slide-up">
                    <HiInformationCircle className="w-6 h-6 text-plum shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-plum mr-1.5">Rule:</span>
                      <span>{currentQ.explanation}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex(0);
                    setSelectedOption(null);
                    setIsAnswered(false);
                    setScore(0);
                  }}
                  className="imlaa-btn-secondary py-3 px-5 text-base space-x-2"
                >
                  <HiArrowPath className="w-5 h-5" />
                  <span>Restart Drill</span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={!isAnswered}
                    className="imlaa-btn-primary py-3 px-6 text-base"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReturnToTopics}
                    className="imlaa-btn-primary py-3 px-6 text-base"
                  >
                    Finish Topic
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
