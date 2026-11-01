import { useState } from "react";
import { createPortal } from "react-dom";
import {
  HiXMark,
  HiAcademicCap,
  HiLightBulb,
  HiExclamationTriangle,
  HiCheckCircle,
  HiXCircle,
  HiArrowRight,
  HiSparkles,
  HiBookOpen,
  HiCheck,
} from "react-icons/hi2";
import { useModalEffects } from "../hooks/useModalEffects";

export default function GrammarLessonModal({
  isOpen,
  onClose,
  lesson,
  onStartDrill,
  onStartIdentification,
}) {
  const [activeTab, setActiveTab] = useState("rule"); // 'rule' | 'examples' | 'quick-check'
  const [quickCheckAnswers, setQuickCheckAnswers] = useState({});
  const [selectedTerm, setSelectedTerm] = useState(null);

  useModalEffects(isOpen, onClose);

  if (!isOpen || !lesson) return null;

  const handleSelectQuickCheck = (qIndex, optionIndex) => {
    if (quickCheckAnswers[qIndex] !== undefined) return; // answered already
    setQuickCheckAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }));
  };

  const handleResetQuickCheck = () => {
    setQuickCheckAnswers({});
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div className="imlaa-card bg-white w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-plum/25 animate-scale-up">
        {/* ==================================================== */}
        {/* 1. Modal Header                                      */}
        {/* ==================================================== */}
        <div className="p-5 sm:p-6 border-b border-plum/15 bg-plum/5 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-plum/15 text-plum border border-plum/20">
                Grammar Masterclass
              </span>
              <span className="text-xs font-semibold text-muted-label uppercase tracking-wider">
                {lesson.category}
              </span>
            </div>
            <h2
              id="lesson-modal-title"
              className="text-xl sm:text-2xl font-black text-body-dark leading-snug"
            >
              {lesson.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-label hover:text-body-dark hover:bg-plum/10 rounded-xl transition cursor-pointer"
            aria-label="Close lesson modal"
          >
            <HiXMark className="w-6 h-6" />
          </button>
        </div>

        {/* ==================================================== */}
        {/* 2. Tab Navigation                                    */}
        {/* ==================================================== */}
        <div className="flex items-center border-b border-plum/15 bg-white px-4 sm:px-6 gap-2 sm:gap-4 overflow-x-auto text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("rule")}
            className={`py-3 px-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "rule"
                ? "border-plum text-plum"
                : "border-transparent text-muted-label hover:text-body-dark"
            }`}
          >
            <HiBookOpen className="w-4 h-4" />
            <span>Rule & Formula</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("examples")}
            className={`py-3 px-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "examples"
                ? "border-plum text-plum"
                : "border-transparent text-muted-label hover:text-body-dark"
            }`}
          >
            <HiSparkles className="w-4 h-4" />
            <span>Worked Examples & Diffs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quick-check")}
            className={`py-3 px-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === "quick-check"
                ? "border-plum text-plum"
                : "border-transparent text-muted-label hover:text-body-dark"
            }`}
          >
            <HiCheckCircle className="w-4 h-4" />
            <span>Quick Check ({lesson.quickCheck?.length || 2} Qs)</span>
          </button>
        </div>

        {/* ==================================================== */}
        {/* 3. Tab Body (Scrollable)                             */}
        {/* ==================================================== */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 text-body-dark">
          {/* TAB 1: RULE & FORMULA */}
          {activeTab === "rule" && (
            <div className="space-y-6 animate-slide-up">
              {/* IELTS Criterion Note */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs sm:text-sm flex items-start space-x-3">
                <HiLightBulb className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-950">
                    IELTS Examiner Scoring Focus
                  </div>
                  <div className="leading-relaxed">{lesson.ieltsImpact}</div>
                </div>
              </div>

              {/* Core Principle */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-plum uppercase tracking-wider">
                  The Core Principle
                </div>
                <p className="text-base sm:text-lg font-semibold text-body-dark leading-relaxed">
                  {lesson.corePrinciple}
                </p>
              </div>

              {/* Visual Syntax Formula */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-plum uppercase tracking-wider">
                  Visual Syntax Formula
                </div>
                <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs sm:text-sm tracking-wide shadow-inner overflow-x-auto border border-slate-800 whitespace-pre-wrap">
                  {lesson.formula}
                </div>
              </div>

              {/* L1 Interference Alert */}
              {lesson.l1Trap && (
                <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-950 text-xs sm:text-sm flex items-start space-x-3">
                  <HiExclamationTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-rose-900">
                      Non-Native L1 Transfer Alert
                    </div>
                    <div className="leading-relaxed">{lesson.l1Trap}</div>
                  </div>
                </div>
              )}

              {/* Key Terminology Pills */}
              {lesson.keyTerms && lesson.keyTerms.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="text-xs font-bold text-plum uppercase tracking-wider">
                    Essential Terminology (Click to Inspect)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lesson.keyTerms.map((termItem) => {
                      const isSelected = selectedTerm?.term === termItem.term;
                      return (
                        <button
                          key={termItem.term}
                          type="button"
                          onClick={() =>
                            setSelectedTerm(isSelected ? null : termItem)
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                            isSelected
                              ? "bg-plum text-white border-plum shadow-xs"
                              : "bg-white text-body-dark border-plum/20 hover:border-plum hover:bg-plum/5"
                          }`}
                        >
                          {termItem.term}
                        </button>
                      );
                    })}
                  </div>

                  {selectedTerm && (
                    <div className="p-3.5 rounded-xl bg-plum/5 border border-plum/15 text-xs sm:text-sm text-body-dark animate-fade-in">
                      <strong className="text-plum">{selectedTerm.term}: </strong>
                      {selectedTerm.definition}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WORKED EXAMPLES & CONTRASTIVE DIFFS */}
          {activeTab === "examples" && (
            <div className="space-y-6 animate-slide-up">
              {/* Stepped Worked Examples */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-plum uppercase tracking-wider">
                  Stepped Sentence Transformations
                </div>

                {lesson.workedExamples?.map((ex, idx) => (
                  <div
                    key={idx}
                    className="imlaa-card p-4 sm:p-5 border border-plum/20 bg-white space-y-3 rounded-xl"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-plum/10 text-plum font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-muted-label">
                        Step-by-Step Breakdown
                      </span>
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200/70 text-rose-950">
                        <span className="font-bold text-rose-700">Original Flawed: </span>
                        <span>{ex.original}</span>
                      </div>

                      <div className="px-1 text-muted-label text-xs">
                        <strong className="text-body-dark">Identified Flaw: </strong>
                        {ex.issue}
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-950">
                        <span className="font-bold text-emerald-700">Corrected Form: </span>
                        <span className="font-semibold">{ex.corrected}</span>
                      </div>

                      <div className="px-1 text-xs text-muted-label">
                        <strong className="text-plum">Rule Applied: </strong>
                        {ex.ruleApplied}
                      </div>

                      {ex.explanation && (
                        <div className="px-1 text-xs text-muted-label leading-relaxed">
                          <strong className="text-body-dark">Examiner Insight: </strong>
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Contrastive Pairs (Correct vs Incorrect) */}
              {lesson.contrastivePairs && lesson.contrastivePairs.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-plum uppercase tracking-wider">
                    Side-by-Side Minimal Contrast Pairs
                  </div>

                  <div className="space-y-3">
                    {lesson.contrastivePairs.map((pair, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-plum/5 border border-plum/15 space-y-2 text-xs sm:text-sm"
                      >
                        <div className="flex items-start space-x-2 text-rose-800">
                          <HiXCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                          <span>
                            <strong>Incorrect: </strong>
                            {pair.incorrect}
                          </span>
                        </div>

                        <div className="flex items-start space-x-2 text-emerald-900">
                          <HiCheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                          <span>
                            <strong>Correct: </strong>
                            <span className="font-semibold">{pair.correct}</span>
                          </span>
                        </div>

                        <div className="pt-1 text-[11px] text-muted-label font-mono">
                          <span className="text-plum font-semibold">Diff: </span>
                          {pair.diffHighlight} &bull; {pair.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUICK CHECK */}
          {activeTab === "quick-check" && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-plum/10">
                <div className="text-xs font-bold text-plum uppercase tracking-wider">
                  Concept Verification Check (No Score Penalty)
                </div>
                {Object.keys(quickCheckAnswers).length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetQuickCheck}
                    className="text-xs font-semibold text-plum hover:text-plum-hover underline cursor-pointer"
                  >
                    Reset Answers
                  </button>
                )}
              </div>

              {lesson.quickCheck?.map((qc, qIdx) => {
                const userAnswer = quickCheckAnswers[qIdx];
                const isAnswered = userAnswer !== undefined;

                return (
                  <div
                    key={qIdx}
                    className="imlaa-card p-5 border border-plum/20 bg-white space-y-3 rounded-xl"
                  >
                    <div className="text-sm sm:text-base font-bold text-body-dark leading-snug">
                      <span className="text-plum mr-1.5">Q{qIdx + 1}.</span>
                      {qc.question}
                    </div>

                    <div className="space-y-2 pt-1">
                      {qc.options.map((opt, optIdx) => {
                        const isSelected = userAnswer === optIdx;
                        const isCorrect = optIdx === qc.correctIndex;

                        let style =
                          "border-plum/20 hover:border-plum hover:bg-plum/5 text-body-dark";
                        if (isAnswered) {
                          if (isCorrect) {
                            style =
                              "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-600";
                          } else if (isSelected && !isCorrect) {
                            style =
                              "border-rose-500 bg-rose-50 text-rose-900 font-bold";
                          } else {
                            style = "border-gray-200 opacity-60 text-muted-label";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isAnswered}
                            onClick={() => handleSelectQuickCheck(qIdx, optIdx)}
                            className={`w-full p-3 text-left rounded-xl border text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${style}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && isCorrect && (
                              <HiCheck className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                            )}
                            {isAnswered && isSelected && !isCorrect && (
                              <HiXCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div className="p-3 rounded-lg bg-plum/5 border border-plum/15 text-xs text-body-dark animate-fade-in">
                        <strong className="text-plum">Explanation: </strong>
                        {qc.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* 4. Action Footer                                     */}
        {/* ==================================================== */}
        <div className="p-4 sm:p-5 border-t border-plum/15 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="imlaa-btn-secondary py-2.5 px-4 text-xs sm:text-sm font-semibold w-full sm:w-auto"
          >
            Close Lesson
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {lesson.identificationExercises &&
              lesson.identificationExercises.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartIdentification?.(lesson);
                  }}
                  className="imlaa-btn-secondary py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 w-full sm:w-auto text-plum hover:bg-plum/5"
                >
                  <HiAcademicCap className="w-4 h-4" />
                  <span>Spot-the-Error Mode</span>
                </button>
              )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onStartDrill?.(lesson);
              }}
              className="imlaa-btn-primary py-2.5 px-5 text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 w-full sm:w-auto"
            >
              <span>Start Practice Drill</span>
              <HiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
