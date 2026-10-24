import { useState, useEffect } from "react";
import apiClient from "../services/apiClient";
import {
  HiCheckCircle,
  HiXCircle,
  HiArrowPath,
  HiInformationCircle,
} from "react-icons/hi2";

const MODULES = [
  { id: "all", label: "Mixed Master Drill" },
  { id: "subject-verb-agreement", label: "Subject-Verb Agreement" },
  { id: "appropriate-prepositions", label: "Appropriate Prepositions" },
];

export default function GrammarPage() {
  const [activeModule, setActiveModule] = useState("all");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch grammar questions from local API
  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      setSelectedOption(null);
      setIsAnswered(false);
      setCurrentIndex(0);
      setScore(0);
      try {
        const params = activeModule === "all" ? {} : { module: activeModule };
        const res = await apiClient.get("/grammar/questions", { params });
        if (res.data?.success) {
          setQuestions(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load grammar questions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [activeModule]);

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

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
  };

  return (
    <div className="w-full flex flex-col space-y-8">
      {/* Module Selector */}
      <div className="flex flex-wrap items-center gap-3 border-b border-plum/20 pb-4">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => setActiveModule(mod.id)}
            className={`imlaa-tab-btn text-base ${
              activeModule === mod.id ? "active" : ""
            }`}
          >
            {mod.label}
          </button>
        ))}

        <div className="ml-auto imlaa-badge text-base">
          Score: {score} / {questions.length}
        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        {loading ? (
          <div className="imlaa-card w-full p-12 text-center animate-pulse">
            <div className="text-xl text-plum font-semibold">
              Loading grammar exercises...
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="imlaa-card w-full p-12 text-center space-y-4">
            <div className="text-2xl font-bold text-body-dark">
              No questions found
            </div>
            <p className="text-base text-muted-label">
              There are no practice drills available in this module right now.
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between text-base text-muted-label px-2">
              <span className="font-medium text-body-dark">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="capitalize font-mono">
                {currentQ.module?.replace(/-/g, " ")}
              </span>
            </div>

            {/* Question Card */}
            <div className="imlaa-card w-full p-8 sm:p-10 flex flex-col space-y-7">
              <h3 className="text-2xl sm:text-3xl font-bold text-body-dark leading-snug">
                {currentQ.questionText}
              </h3>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentQ.correctAnswer;

                  let btnStyle = "border-plum/20 hover:border-plum bg-white text-body-dark";
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold";
                    } else if (isSelected) {
                      btnStyle = "border-rose-600 bg-rose-50 text-rose-900 font-bold";
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

              {/* One-sentence immediate pedagogical explanation */}
              {isAnswered && (
                <div className="p-4 rounded-xl bg-plum/5 border border-plum/20 flex items-start space-x-3 text-base text-body-dark">
                  <HiInformationCircle className="w-6 h-6 text-plum shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-plum mr-1.5">Rule:</span>
                    <span>{currentQ.explanation}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleRestart}
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
                  onClick={handleRestart}
                  className="imlaa-btn-primary py-3 px-6 text-base"
                >
                  Complete & Restart
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
