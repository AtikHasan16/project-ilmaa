import { useState } from "react";
import apiClient from "../services/apiClient";
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
const GRAMMAR_CATEGORIES = [
  { id: "nouns-prepositions", label: "Nouns & Prepositions", countBadge: "6 Topics" },
  { id: "sentence-structure", label: "Sentence Structure", countBadge: "4 Topics" },
  { id: "tenses-voice", label: "Tenses & Voice", countBadge: "5 Topics" },
  { id: "mixed", label: "Mixed All-in-One", countBadge: "Full Review" },
];

const GRAMMAR_TOPICS = [
  {
    id: "subject-verb-agreement",
    category: "nouns-prepositions",
    num: "01",
    subtag: "SYNTAX",
    badge: "Core",
    badgeColor: "text-plum bg-plum/5 border-plum/25",
    title: "Subject-Verb Agreement",
    description: "Inverted sentences, collective nouns & compound subjects.",
    exercisesCount: "42 Exercises",
  },
  {
    id: "parallelism",
    category: "nouns-prepositions",
    num: "02",
    subtag: "BALANCE",
    badge: "Advanced",
    badgeColor: "text-indigo-800 bg-indigo-50 border-indigo-200",
    title: "Parallelism & Correlative Conjunctions",
    description: "Balancing clauses with 'either/or', 'not only/but also'.",
    exercisesCount: "36 Exercises",
  },
  {
    id: "parts-of-speech",
    category: "nouns-prepositions",
    num: "03",
    subtag: "MORPHOLOGY",
    badge: "Critical",
    badgeColor: "text-rose-800 bg-rose-50 border-rose-200",
    title: "Parts of Speech & Derivations",
    description: "Nominalization, adjective-adverb confusion.",
    exercisesCount: "50 Exercises",
  },
  {
    id: "dependent-prepositions",
    category: "nouns-prepositions",
    num: "04",
    subtag: "COLLOCATIONS",
    badge: "High Error Rate",
    badgeColor: "text-amber-800 bg-amber-50 border-amber-200",
    title: "Dependent Prepositions",
    description: "Fixed collocations, prepositional idioms.",
    exercisesCount: "64 Exercises",
  },
  {
    id: "singular-plural-nouns",
    category: "nouns-prepositions",
    num: "05",
    subtag: "LEXICON",
    badge: "Memorization",
    badgeColor: "text-gray-800 bg-gray-100 border-gray-300",
    title: "500 Singular & Plural Nouns",
    description: "Irregular plurals, foreign plurals (phenomenon/phenomena).",
    exercisesCount: "80 Exercises",
  },
  {
    id: "voice-change",
    category: "nouns-prepositions",
    num: "06",
    subtag: "DISCOURSE",
    badge: "Scholastic",
    badgeColor: "text-teal-800 bg-teal-50 border-teal-200",
    title: "Voice Change & Passive Constraints",
    description: "Agent omission, stative passives, transitive restrictions.",
    exercisesCount: "38 Exercises",
  },
  // Sentence Structure Category
  {
    id: "modifiers-dangling",
    category: "sentence-structure",
    num: "01",
    subtag: "MODIFIERS",
    badge: "High Error Rate",
    badgeColor: "text-amber-800 bg-amber-50 border-amber-200",
    title: "Dangling & Misplaced Modifiers",
    description: "Participial phrases and elliptical clauses without logical subjects.",
    exercisesCount: "30 Exercises",
  },
  {
    id: "run-on-comma-splices",
    category: "sentence-structure",
    num: "02",
    subtag: "PUNCTUATION",
    badge: "Critical",
    badgeColor: "text-rose-800 bg-rose-50 border-rose-200",
    title: "Run-On Sentences & Comma Splices",
    description: "Coordinating conjunctions and semicolon linking mechanisms.",
    exercisesCount: "44 Exercises",
  },
  // Tenses & Voice Category
  {
    id: "conditional-clauses",
    category: "tenses-voice",
    num: "01",
    subtag: "CONDITIONALS",
    badge: "Advanced",
    badgeColor: "text-indigo-800 bg-indigo-50 border-indigo-200",
    title: "Subjunctive & Conditional Inversions",
    description: "Had I known, Were he present, and unreal hypothetical syntax.",
    exercisesCount: "32 Exercises",
  },
];

export default function GrammarPage() {
  const [activeCategory, setActiveCategory] = useState("nouns-prepositions");
  const [selectedTopic, setSelectedTopic] = useState(null); // When null => show topic grid
  const [viewMode, setViewMode] = useState("overview"); // 'overview' | 'quiz'

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load questions for topic
  const loadQuestions = async (topicId) => {
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
        // Fallback default exercises
        setQuestions([
          {
            module: "subject-verb-agreement",
            questionText: "Neither the teacher nor the students ____ present at yesterday's seminar.",
            options: ["was", "were", "is", "are"],
            correctAnswer: "were",
            explanation: "When subjects are joined by 'neither... nor', the verb agrees with the closer subject ('students').",
          },
          {
            module: "appropriate-prepositions",
            questionText: "She has always been deeply devoted ____ her scientific research.",
            options: ["to", "for", "with", "at"],
            correctAnswer: "to",
            explanation: "The adjective 'devoted' strictly takes the preposition 'to'.",
          },
          {
            module: "parallelism",
            questionText: "The professor evaluated the essay not only for its originality but also ____.",
            options: ["for its coherence", "its coherence", "because it was coherent", "coherently"],
            correctAnswer: "for its coherence",
            explanation: "Correlative conjunctions require balanced prepositional phrasing ('for its X... but also for its Y').",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTopic = (topic) => {
    setSelectedTopic(topic);
    setViewMode("quiz");
    loadQuestions(topic.id);
  };

  const handleReturnToTopics = () => {
    setSelectedTopic(null);
    setViewMode("overview");
    setSelectedOption(null);
    setIsAnswered(false);
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
    activeCategory === "mixed"
      ? GRAMMAR_TOPICS
      : GRAMMAR_TOPICS.filter((t) => t.category === activeCategory);

  return (
    <div className="w-full flex flex-col space-y-7 animate-slide-up">
      {/* ==================================================== */}
      {/* 1. Header Bar: Title, Subtitle, Corpus Verified Badge*/}
      {/* ==================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div>
          <div className="text-base text-plum font-bold uppercase tracking-wider mb-1">
            MODULE 02 • SYNTACTIC PRECISION • Level C1 Academic
          </div>
          <h1 className="text-3xl font-black text-body-dark tracking-tight">
            Grammar & Syntactic Accuracy
          </h1>
          <p className="text-base text-muted-label mt-1">
            Targeted structural mastery and error elimination.
          </p>
        </div>

        <div className="flex items-center space-x-2 border border-plum/25 bg-plum/5 px-3.5 py-1.5 rounded-xl self-start md:self-auto text-base text-plum font-semibold">
          <HiShieldCheck className="w-5 h-5 text-plum" />
          <span>Corpus Verified: 1,480 Rules</span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. Topics Overview View (Home Selection Page)        */}
      {/* ==================================================== */}
      {viewMode === "overview" && (
        <div className="flex flex-col space-y-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {GRAMMAR_CATEGORIES.map((cat) => (
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
                  className={`text-sm px-2 py-0.5 rounded-full font-bold ${
                    activeCategory === cat.id
                      ? "bg-white/20 text-white"
                      : "bg-plum/10 text-plum"
                  }`}
                >
                  {cat.countBadge}
                </span>
              </button>
            ))}
          </div>

          {/* Grammar Topic Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="imlaa-card p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 border border-plum/20"
              >
                <div>
                  {/* Top Row: Subtag and Badge */}
                  <div className="flex items-center justify-between text-base font-semibold mb-3">
                    <span className="text-muted-label tracking-wider font-mono">
                      {topic.num} • {topic.subtag}
                    </span>
                    <span
                      className={`text-base font-bold px-2.5 py-0.5 rounded-full border ${topic.badgeColor}`}
                    >
                      • {topic.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-body-dark leading-snug mb-2">
                    {topic.title}
                  </h3>

                  {/* Description */}
                  <p className="text-base text-muted-label leading-relaxed mb-6">
                    {topic.description}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-3 border-t border-plum/10">
                  <span className="text-base text-muted-label font-medium">
                    {topic.exercisesCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartTopic(topic)}
                    className="imlaa-btn-primary py-2 px-4 text-base space-x-1.5"
                  >
                    <span>Practice</span>
                    <HiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Diagnostic Banner */}
          <div className="imlaa-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-plum/25 bg-plum/5">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-plum/10 border border-plum/20 flex items-center justify-center text-plum">
                <HiClock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-bold text-body-dark">
                    Quick Diagnostic
                  </h4>
                  <span className="text-base font-bold px-2 py-0.5 rounded bg-body-dark text-white">
                    Adaptive
                  </span>
                </div>
                <p className="text-base text-muted-label mt-0.5">
                  10 random questions from Nouns & Prepositions to calibrate your baseline accuracy.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleStartTopic({
                  id: "all",
                  title: "Quick Diagnostic Drill",
                  description: "10 random questions",
                })
              }
              className="imlaa-btn-primary py-3 px-6 text-base whitespace-nowrap self-stretch sm:self-auto"
            >
              Start Rapid Test (5 min)
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
