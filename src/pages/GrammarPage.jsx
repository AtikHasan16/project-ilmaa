import { useState, useEffect, useCallback } from "react";
import RandomQuizSetupModal from "../components/RandomQuizSetupModal";
import { useCountdownTimer } from "../hooks/useCountdownTimer";
import { useModalEffects } from "../hooks/useModalEffects";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { secureShuffle } from "../utils/cryptoRandom";
import {
  HiCheckCircle,
  HiXCircle,
  HiArrowPath,
  HiInformationCircle,
  HiArrowLeft,
  HiShieldCheck,
  HiClock,
  HiSparkles,
} from "react-icons/hi2";

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
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [viewMode, setViewMode] = useState("overview"); // 'overview' | 'quiz' | 'finished'
  const [drillStartTime, setDrillStartTime] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [grammarStats, setGrammarStats] = useState(null);

  // Random Quiz Modal & State (Item 6)
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizQuantity, setQuizQuantity] = useState(10);
  const [quizTimerMinutes, setQuizTimerMinutes] = useState(0);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(0);
  const [isRandomQuiz, setIsRandomQuiz] = useState(false);
  const { startTimer: startQuizTimer, stopTimer: stopQuizTimer } =
    useCountdownTimer(setQuizTimeRemaining, () => setViewMode("finished"));
  useModalEffects(quizModalOpen, setQuizModalOpen);

  // Fetch dynamic grammar statistics
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

  const dynamicGrammarTopics = GRAMMAR_TOPICS.map((topic) => {
    const byModule = grammarStats?.byModule || {};
    let realCount;
    if (byModule[topic.id] !== undefined) {
      realCount = byModule[topic.id];
    } else if (topic.id === "modifiers-and-splices") {
      realCount =
        byModule["modifiers-and-splices"] ||
        (byModule["modifiers-dangling"] || 0) + (byModule["run-on-comma-splices"] || 0);
    } else {
      realCount = 0;
    }
    const percent = realCount > 0 ? Math.min(100, Math.round((realCount / 50) * 100)) : 0;
    return {
      ...topic,
      realCount,
      exercisesCount: realCount === 1 ? "1 Question" : `${realCount} Questions`,
      percent,
    };
  });

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
      setIsRandomQuiz(false);
      setViewMode("quiz");
      setDrillStartTime(Date.now());
      loadQuestions(topic.id);
    },
    [loadQuestions],
  );

  const handleReturnToTopics = () => {
    stopQuizTimer();
    if (user?.id && drillStartTime) {
      const durationSeconds = Math.max(1, Math.round((Date.now() - drillStartTime) / 1000));
      apiClient
        .post("/user/study-session", {
          durationSeconds,
          grammarScore: score,
          totalQuestions: currentIndex + 1,
        })
        .catch((err) => console.warn("Could not save study session:", err));
    }

    setSelectedTopic(null);
    setViewMode("overview");
    setSelectedOption(null);
    setIsAnswered(false);
    setDrillStartTime(null);
  };

  // Launch Random Grammar Quiz (Item 6)
  const launchRandomQuiz = async () => {
    setQuizModalOpen(false);
    setLoading(true);
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex(0);
    setScore(0);
    setIsRandomQuiz(true);
    setDrillStartTime(Date.now());

    try {
      const res = await apiClient.get("/grammar/questions");
      const allQ = res.data?.data || [];
      if (allQ.length === 0) return;

      const shuffled = secureShuffle(allQ);
      const selected = shuffled.slice(0, Math.min(quizQuantity, shuffled.length));

      setQuestions(selected);
      setSelectedTopic({
        title: `Random Grammar Quiz (${selected.length} Qs)`,
        description: "Timed synthesis across all grammatical structures.",
      });

      setViewMode("quiz");
      startQuizTimer(quizTimerMinutes);
    } finally {
      setLoading(false);
    }
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
    } else {
      stopQuizTimer();
      setViewMode("finished");
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const filteredTopics =
    activeCategory === "all"
      ? dynamicGrammarTopics
      : dynamicGrammarTopics.filter((t) => t.category === activeCategory);

  const totalQuestionsInDatabase = grammarStats?.totalCount ?? 0;

  return (
    <div className="w-full flex flex-col space-y-7 animate-slide-up">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div>
          <h1 className="text-3xl font-black text-body-dark tracking-tight">
            Grammar & Syntactic Accuracy
          </h1>
          <p className="text-base text-muted-label mt-1">
            Targeted structural drills, error elimination, and timed quizzes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setQuizModalOpen(true)}
            className="imlaa-btn-secondary text-sm py-2 px-4 flex items-center space-x-2 font-bold"
          >
            <HiSparkles className="w-4 h-4 text-plum" />
            <span>Random Grammar Quiz</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2 border border-plum/25 bg-plum/5 px-3.5 py-1.5 rounded-xl text-sm text-plum font-semibold">
            <HiShieldCheck className="w-4 h-4 text-plum" />
            <span>{totalQuestionsInDatabase} Verified</span>
          </div>
        </div>
      </div>

      {/* 2. Topics Overview */}
      {viewMode === "overview" && (
        <div className="flex flex-col space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="imlaa-card p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 border border-plum/20"
              >
                <div>
                  <div className="flex items-center justify-between text-base font-semibold mb-2">
                    <span className="text-muted-label font-semibold">
                      {topic.exercisesCount}
                    </span>
                    <span className="text-body-dark font-medium">
                      {topic.percent}% Mastery
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-body-dark leading-snug mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-base text-muted-label leading-relaxed mb-4">
                    {topic.description}
                  </p>
                </div>

                <div>
                  <div className="mb-4">
                    <div className="w-full bg-plum/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-plum transition-all duration-500"
                        style={{ width: `${topic.percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-plum/10">
                    <span className="text-sm text-muted-label font-medium">
                      {topic.realCount === 0 ? "Corpus Loading" : "Target 50"}
                    </span>
                    <button
                      type="button"
                      disabled={!topic.realCount || topic.realCount === 0}
                      onClick={() => handleStartTopic(topic)}
                      className={`py-2 px-5 text-base rounded-lg font-semibold transition-all ${
                        !topic.realCount || topic.realCount === 0
                          ? "bg-plum/20 text-white/70 cursor-not-allowed opacity-50"
                          : "imlaa-btn-primary cursor-pointer"
                      }`}
                    >
                      {topic.realCount === 0 ? "Coming Soon" : "Start Drill"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Quiz & Drill Mode */}
      {viewMode === "quiz" && (
        <div className="w-full max-w-2xl mx-auto flex flex-col space-y-6">
          <div className="flex items-center justify-between text-base px-1">
            <button
              type="button"
              onClick={handleReturnToTopics}
              className="inline-flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold cursor-pointer"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back to Overview</span>
            </button>

            {isRandomQuiz && quizTimerMinutes > 0 && (
              <div className="flex items-center space-x-2 bg-plum/10 text-plum font-mono font-bold px-3 py-1 rounded-xl">
                <HiClock className="w-5 h-5" />
                <span>{formatTimer(quizTimeRemaining)}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="imlaa-card w-full p-16 text-center animate-pulse">
              <div className="text-xl text-plum font-semibold">
                Loading grammar questions...
              </div>
            </div>
          ) : !currentQ ? (
            <div className="imlaa-card w-full p-12 text-center space-y-4">
              <div className="text-2xl font-bold text-body-dark">
                No questions found
              </div>
              <button
                type="button"
                onClick={handleReturnToTopics}
                className="imlaa-btn-primary text-base"
              >
                Choose Another Module
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col space-y-6">
              <div className="w-full flex items-center justify-between px-1">
                <span className="text-base font-bold text-body-dark bg-white px-3.5 py-1.5 rounded-xl border border-plum/20 shadow-xs">
                  Question <span className="text-plum">{currentIndex + 1}</span> of {questions.length}
                </span>

                <div className="flex items-center space-x-2 text-base font-bold text-body-dark">
                  <span>Score:</span>
                  <span className="text-plum">{score}</span>
                </div>
              </div>

              <div className="imlaa-card p-6 sm:p-8 bg-white border border-plum/20 shadow-md space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-label">
                    Sentence Correction & Synthesis
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-body-dark mt-2 leading-relaxed">
                    {currentQ.question}
                  </h3>
                </div>

                <div className="space-y-3 pt-2">
                  {currentQ.options?.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = option === currentQ.correctAnswer;
                    let btnStyle = "border-plum/20 hover:border-plum hover:bg-plum/5 text-body-dark";

                    if (isAnswered) {
                      if (isCorrect) {
                        btnStyle = "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-600";
                      } else if (isSelected && !isCorrect) {
                        btnStyle = "border-rose-600 bg-rose-50 text-rose-900 font-bold ring-1 ring-rose-600";
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

                {isAnswered && currentQ.explanation && (
                  <div className="p-4 rounded-xl bg-plum/5 border border-plum/20 flex items-start space-x-3 text-base text-body-dark animate-slide-up">
                    <HiInformationCircle className="w-6 h-6 text-plum shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-plum mr-1.5">Rule:</span>
                      <span>{currentQ.explanation}</span>
                    </div>
                  </div>
                )}
              </div>

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
                  <span>Restart</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={!isAnswered}
                  className="imlaa-btn-primary py-3 px-6 text-base font-bold"
                >
                  {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Quiz Completion Screen */}
      {viewMode === "finished" && (
        <div className="w-full max-w-xl mx-auto imlaa-card p-8 sm:p-10 text-center space-y-7 animate-slide-up border border-plum/20 shadow-lg bg-white">
          <div className="w-16 h-16 rounded-full bg-plum/10 text-plum mx-auto flex items-center justify-center">
            <HiSparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-body-dark">
              Grammar Drill Completed!
            </h2>
            <p className="text-base text-muted-label">
              Performance summary for {selectedTopic?.title}.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-plum/5 border border-plum/20 space-y-2">
            <div className="text-5xl font-black text-plum">
              {score} / {questions.length}
            </div>
            <div className="text-sm font-bold text-muted-label uppercase tracking-wider">
              {Math.round((score / (questions.length || 1)) * 100)}% Accuracy
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-plum/10">
            <button
              type="button"
              onClick={() => {
                if (isRandomQuiz) {
                  launchRandomQuiz();
                } else {
                  loadQuestions(selectedTopic.id);
                  setViewMode("quiz");
                }
              }}
              className="imlaa-btn-primary py-3 px-6 text-base font-bold"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={handleReturnToTopics}
              className="imlaa-btn-secondary py-3 px-6 text-base font-semibold"
            >
              Back to Overview
            </button>
          </div>
        </div>
      )}

      {quizModalOpen && (
        <RandomQuizSetupModal
          title="Random Grammar Quiz"
          questionLabel="Number of Questions"
          quantity={quizQuantity}
          onQuantityChange={setQuizQuantity}
          timerMinutes={quizTimerMinutes}
          onTimerChange={setQuizTimerMinutes}
          onCancel={() => setQuizModalOpen(false)}
          onStart={launchRandomQuiz}
        />
      )}
    </div>
  );
}
