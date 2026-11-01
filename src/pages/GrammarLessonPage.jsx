import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  HiArrowLeft,
  HiArrowRight,
  HiBookOpen,
  HiAcademicCap,
  HiLightBulb,
  HiSparkles,
  HiCheckCircle,
  HiXCircle,
  HiExclamationTriangle,
  HiClipboardDocument,
  HiClipboardDocumentCheck,
  HiBookmark,
  HiQuestionMarkCircle,
  HiCheck,
} from "react-icons/hi2";
import { GRAMMAR_LESSONS, getLessonByTopicId } from "../data/grammarLessonsData";

const ZOOM_LEVELS = [
  { level: 100, label: "100%", description: "Standard Size" },
  { level: 115, label: "115%", description: "Comfortable Reading" },
  { level: 130, label: "130%", description: "Large / Low-Vision" },
];

export default function GrammarLessonPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  // Active lesson resolution
  const lesson = useMemo(() => {
    if (topicId) {
      const found = getLessonByTopicId(topicId);
      if (found) return found;
    }
    return GRAMMAR_LESSONS[0];
  }, [topicId]);

  // Current lesson index & next lesson
  const lessonIndex = useMemo(
    () => GRAMMAR_LESSONS.findIndex((l) => l.id === lesson.id),
    [lesson.id]
  );
  const nextLesson = useMemo(() => {
    const nextIdx = (lessonIndex + 1) % GRAMMAR_LESSONS.length;
    return GRAMMAR_LESSONS[nextIdx];
  }, [lessonIndex]);

  // Accessibility: font zoom state (persisted)
  const [zoomLevel, setZoomLevel] = useState(() => {
    try {
      const saved = localStorage.getItem("spell2master_grammar_zoom");
      const parsed = parseInt(saved, 10);
      return [100, 115, 130].includes(parsed) ? parsed : 100;
    } catch {
      return 100;
    }
  });

  const handleZoomChange = useCallback((newLevel) => {
    setZoomLevel(newLevel);
    try {
      localStorage.setItem("spell2master_grammar_zoom", String(newLevel));
    } catch {
      // storage disabled
    }
  }, []);

  // Copy formula state
  const formulaText = lesson.formula;
  const [copiedFormula, setCopiedFormula] = useState(false);
  const handleCopyFormula = useCallback(() => {
    if (!formulaText) return;
    navigator.clipboard.writeText(formulaText).then(() => {
      setCopiedFormula(true);
      setTimeout(() => setCopiedFormula(false), 2200);
    });
  }, [formulaText]);

  // Stepped transformations active tab (0 to 4, or -1 for "all")
  const [activeExampleIdx, setActiveExampleIdx] = useState(0);

  // Spot the Error interactive state: { [exerciseId]: { selectedSentenceIdx: number, isSubmitted: boolean } }
  const [spotErrorStates, setSpotErrorStates] = useState({});

  // Quick check state: { [questionIdx]: selectedOptionIdx }
  const [quickCheckAnswers, setQuickCheckAnswers] = useState({});

  // Reset interactive exercises when lesson changes
  useEffect(() => {
    setActiveExampleIdx(0);
    setSpotErrorStates({});
    setQuickCheckAnswers({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lesson.id]);

  const handleSelectSpotSentence = (exerciseId, sentenceIdx) => {
    setSpotErrorStates((prev) => ({
      ...prev,
      [exerciseId]: { selectedSentenceIdx: sentenceIdx, isSubmitted: true },
    }));
  };

  const handleSelectQuickCheck = (qIdx, optIdx) => {
    setQuickCheckAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  const handleStartDrill = () => {
    navigate(`/workspace/grammar?topic=${lesson.id}&start=true`);
  };

  return (
    <div className="w-full flex flex-col space-y-7 animate-slide-up text-gray-900 pb-12">
      {/* 1. Header Toolbar: Back Button, Breadcrumb & Font Zoom */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div className="flex items-center space-x-3">
          <Link
            to="/workspace/grammar"
            className="imlaa-btn-secondary py-2 px-3.5 text-xs sm:text-sm font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Return to Grammar Hub"
          >
            <HiArrowLeft className="w-4 h-4 text-plum" />
            <span>Grammar Hub</span>
          </Link>

          <span className="text-muted-label">/</span>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-plum block">
              Guided Lesson &middot; Module {lessonIndex + 1} of {GRAMMAR_LESSONS.length}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Accessibility Zoom & Drill CTA */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Zoom Controller */}
          <div
            className="flex items-center bg-white border border-plum/25 rounded-xl p-1 shadow-xs"
            role="group"
            aria-label="Font zoom controls"
          >
            <span className="text-xs font-semibold text-muted-label px-2 hidden sm:inline">
              Text Size:
            </span>
            <button
              type="button"
              onClick={() => handleZoomChange(Math.max(100, zoomLevel - 15))}
              disabled={zoomLevel <= 100}
              className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-plum/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-plum"
              title="Decrease text size"
            >
              A-
            </button>
            <div className="flex items-center space-x-1 px-1">
              {ZOOM_LEVELS.map((z) => (
                <button
                  key={z.level}
                  type="button"
                  onClick={() => handleZoomChange(z.level)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    zoomLevel === z.level
                      ? "bg-plum text-white shadow-xs"
                      : "text-plum hover:bg-plum/10"
                  }`}
                  title={z.description}
                >
                  {z.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleZoomChange(Math.min(130, zoomLevel + 15))}
              disabled={zoomLevel >= 130}
              className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-plum/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-plum"
              title="Increase text size"
            >
              A+
            </button>
          </div>

          {/* Quick Practice Drill CTA */}
          <button
            type="button"
            onClick={handleStartDrill}
            className="imlaa-btn-primary py-2 px-4 text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <HiSparkles className="w-4 h-4 text-amber-300" />
            <span>Practice Drill</span>
          </button>
        </div>
      </div>

      {/* 2. Topic Switcher Pills (Horizontal, Clean Plum Styling) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-label shrink-0 mr-1 hidden sm:inline">
          Modules:
        </span>
        {GRAMMAR_LESSONS.map((item) => {
          const isActive = item.id === lesson.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/workspace/grammar/lesson/${item.id}`)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                isActive
                  ? "bg-plum text-white shadow-xs"
                  : "bg-white text-gray-800 hover:bg-plum/10 border border-plum/20"
              }`}
            >
              <span>{item.title.split(":")[0].split("&")[0].trim()}</span>
              {isActive && <HiCheck className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </div>

      {/* 3. Scalable Content Container (Controlled by Zoom) */}
      <div
        id="lesson-content-body"
        className="w-full flex flex-col space-y-8 transition-all duration-150"
        style={{
          zoom: zoomLevel / 100,
        }}
      >
        {/* SECTION 1: OVERVIEW & IELTS EXAMINER IMPACT (Chunked 2-Card Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Core Principle */}
          <div className="imlaa-card overflow-hidden border border-plum/25 shadow-sm rounded-xl flex flex-col">
            <div className="bg-plum text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HiBookmark className="w-4 h-4 text-amber-300" />
                <h3 className="font-bold text-sm tracking-wide">
                  The Golden Rule
                </h3>
              </div>
              <span className="text-xs bg-white/20 text-white font-medium px-2.5 py-0.5 rounded-full">
                Core Concept
              </span>
            </div>
            <div className="p-5 sm:p-6 bg-white text-gray-900 flex-1 flex flex-col justify-between">
              <p className="text-base sm:text-lg leading-relaxed text-gray-900 font-medium">
                {lesson.corePrinciple}
              </p>
              <div className="mt-4 pt-3 border-t border-plum/10 flex items-center justify-between text-xs font-semibold text-plum">
                <span>Goal:</span>
                <span className="bg-plum/10 px-2 py-0.5 rounded-md">Crystal-clear, natural communication</span>
              </div>
            </div>
          </div>

          {/* Card B: IELTS Examiner Insight */}
          <div className="imlaa-card overflow-hidden border border-plum/25 shadow-sm rounded-xl flex flex-col">
            <div className="bg-plum text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HiAcademicCap className="w-4 h-4 text-amber-300" />
                <h3 className="font-bold text-sm tracking-wide">
                  Why IELTS Examiners Care
                </h3>
              </div>
              <span className="text-xs bg-white/20 text-white font-medium px-2.5 py-0.5 rounded-full">
                Band 8.0+ Target
              </span>
            </div>
            <div className="p-5 sm:p-6 bg-white text-gray-900 flex-1 flex flex-col justify-between">
              <p className="text-base sm:text-lg leading-relaxed text-gray-900">
                {lesson.ieltsImpact}
              </p>
              <div className="mt-4 pt-3 border-t border-plum/10 flex items-center justify-between text-xs font-semibold text-plum">
                <span>Exam Criterion:</span>
                <span className="bg-plum/10 px-2 py-0.5 rounded-md">Grammatical Range & Accuracy (GRA)</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: COMMON TRAP / FIRST LANGUAGE INTERFERENCE */}
        {lesson.l1Trap && (
          <div className="imlaa-card overflow-hidden border border-plum/25 shadow-sm rounded-xl">
            <div className="bg-plum text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HiExclamationTriangle className="w-4 h-4 text-amber-300" />
                <h3 className="font-bold text-sm tracking-wide">
                  Common Trap: Native Language Interference
                </h3>
              </div>
              <span className="text-xs bg-white/20 text-white font-medium px-2.5 py-0.5 rounded-full">
                Avoid Point Deductions
              </span>
            </div>
            <div className="p-5 sm:p-6 bg-white text-gray-900 space-y-3">
              <p className="text-base leading-relaxed text-gray-900">
                {lesson.l1Trap}
              </p>
              <div className="p-3.5 bg-amber-50/70 border-l-4 border-amber-500 rounded-r-lg text-sm text-gray-900 font-medium">
                💡 <span className="font-bold text-amber-900">Examiner Advice: </span>
                Always review your writing specifically looking for these patterns before submitting your IELTS Task 2 essay.
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: CLEAR RULES & EVERYDAY PATTERNS (Replacing Unnecessary Syntax Terminal) */}
        <div className="imlaa-card overflow-hidden border border-plum/25 shadow-sm rounded-xl">
          <div className="bg-plum text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HiLightBulb className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-sm sm:text-base tracking-wide">
                Clear Rules & Everyday Patterns
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyFormula}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
              title="Copy rule summary to clipboard"
            >
              {copiedFormula ? (
                <>
                  <HiClipboardDocumentCheck className="w-4 h-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <HiClipboardDocument className="w-4 h-4 text-white" />
                  <span>Copy Rules</span>
                </>
              )}
            </button>
          </div>

          <div className="p-5 sm:p-6 bg-white text-gray-900 space-y-4">
            <div className="p-4 sm:p-5 bg-plum/5 border border-plum/15 rounded-xl font-sans text-sm sm:text-base leading-relaxed text-gray-900 whitespace-pre-wrap">
              {lesson.formula}
            </div>
          </div>
        </div>

        {/* SECTION 4: ACADEMIC TERMINOLOGY EXPLAINED SIMPLY */}
        {lesson.keyTerms && lesson.keyTerms.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HiBookOpen className="w-5 h-5 text-plum" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                Important Terms Explained Simply
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lesson.keyTerms.map((kt, idx) => (
                <div
                  key={idx}
                  className="imlaa-card p-4 sm:p-5 border border-plum/20 shadow-xs hover:border-plum/40 transition-all rounded-xl flex flex-col justify-between bg-white"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-plum block mb-1">
                      Term #{idx + 1}
                    </span>
                    <h4 className="font-bold text-base text-gray-900 mb-1.5">
                      {kt.term}
                    </h4>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {kt.definition}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: STEPPED SYNTACTIC TRANSFORMATIONS (WORKED EXAMPLES) */}
        {lesson.workedExamples && lesson.workedExamples.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <HiSparkles className="w-5 h-5 text-plum" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  Worked Syntactic Transformations
                </h3>
              </div>

              {/* Example Tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
                {lesson.workedExamples.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveExampleIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                      activeExampleIdx === idx
                        ? "bg-plum text-white shadow-xs"
                        : "bg-white text-gray-800 hover:text-plum border border-plum/20"
                    }`}
                  >
                    Ex. {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setActiveExampleIdx(-1)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    activeExampleIdx === -1
                      ? "bg-plum text-white shadow-xs"
                      : "bg-white text-gray-800 hover:text-plum border border-plum/20"
                  }`}
                >
                  View All ({lesson.workedExamples.length})
                </button>
              </div>
            </div>

            {/* Display Active or All Worked Examples */}
            <div className="space-y-6">
              {lesson.workedExamples.map((ex, idx) => {
                if (activeExampleIdx !== -1 && activeExampleIdx !== idx) {
                  return null;
                }

                return (
                  <div
                    key={idx}
                    className="imlaa-card overflow-hidden border border-plum/25 shadow-sm rounded-xl mb-4"
                  >
                    {/* Header: Primary Plum background, White text */}
                    <div className="bg-plum text-white px-5 py-3.5 flex items-center justify-between">
                      <span className="font-bold text-sm tracking-wide">
                        Worked Transformation #{idx + 1}
                      </span>
                      <span className="text-xs bg-white/20 text-white font-medium px-2.5 py-1 rounded-full">
                        Band 6.0 Flaw &rarr; Band 8.5+ Precision
                      </span>
                    </div>

                    {/* Body: Clean White background, Crisp Black text */}
                    <div className="p-5 sm:p-6 bg-white text-gray-900 space-y-4">
                      {/* 1. Flawed input */}
                      <div className="border-l-4 border-red-500 bg-red-50/50 p-4 rounded-r-xl">
                        <span className="text-xs font-bold text-red-700 uppercase tracking-wider block mb-1">
                          ✗ What to Avoid (Common Mistake):
                        </span>
                        <p className="text-base font-semibold text-gray-900 italic">
                          &ldquo;{ex.original}&rdquo;
                        </p>
                        <p className="text-sm text-gray-800 mt-2 font-normal leading-relaxed">
                          <span className="font-bold text-red-900">What is wrong: </span>
                          {ex.issue}
                        </p>
                      </div>

                      {/* 2. Band 8.5+ Solution */}
                      <div className="border-l-4 border-emerald-600 bg-emerald-50/50 p-4 rounded-r-xl">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                          ✓ Better Choice (Band 8.5+ Accurate Solution):
                        </span>
                        <p className="text-base font-bold text-gray-900">
                          &ldquo;{ex.corrected}&rdquo;
                        </p>
                      </div>

                      {/* 3. Rule Applied & Examiner Commentary */}
                      <div className="border-l-4 border-plum bg-plum/5 p-4 rounded-r-xl text-gray-900">
                        <p className="text-sm font-semibold text-gray-900">
                          <span className="font-bold text-plum">Rule Applied: </span>
                          {ex.ruleApplied}
                        </p>
                        <p className="text-sm text-gray-800 mt-1.5 leading-relaxed">
                          <span className="font-bold text-gray-900">Why examiners prefer this: </span>
                          {ex.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 6: MINIMAL CONTRAST PAIRS */}
        {lesson.contrastivePairs && lesson.contrastivePairs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HiAcademicCap className="w-5 h-5 text-plum" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                Quick Before &amp; After Comparisons
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lesson.contrastivePairs.map((pair, idx) => (
                <div
                  key={idx}
                  className="imlaa-card overflow-hidden border border-plum/25 shadow-sm rounded-xl"
                >
                  {/* Header: Primary Plum background, White text */}
                  <div className="bg-plum text-white px-4 py-3 flex items-center justify-between">
                    <span className="font-bold text-sm tracking-wide">
                      Comparison #{idx + 1}
                    </span>
                    <span className="text-xs bg-white/20 text-white font-mono font-bold px-2 py-0.5 rounded">
                      {pair.diffHighlight}
                    </span>
                  </div>

                  {/* Body: White background, Black text */}
                  <div className="p-4 sm:p-5 bg-white text-gray-900 space-y-3">
                    {/* Avoid */}
                    <div className="border-l-4 border-red-500 bg-red-50/50 p-3 rounded-r-lg">
                      <span className="text-xs font-bold text-red-700 block mb-0.5">
                        ✗ Common Mistake:
                      </span>
                      <p className="text-sm font-medium text-gray-900">
                        {pair.incorrect}
                      </p>
                    </div>

                    {/* Correct */}
                    <div className="border-l-4 border-emerald-600 bg-emerald-50/50 p-3 rounded-r-lg">
                      <span className="text-xs font-bold text-emerald-800 block mb-0.5">
                        ✓ Correct &amp; Natural:
                      </span>
                      <p className="text-sm font-bold text-gray-900">
                        {pair.correct}
                      </p>
                    </div>

                    {/* Explanation */}
                    <p className="text-xs sm:text-sm text-gray-800 pt-1 leading-relaxed">
                      <span className="font-bold text-gray-900">Why this matters: </span>
                      {pair.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 7: INTERACTIVE "SPOT-THE-ERROR" PATTERN DRILL */}
        {lesson.identificationExercises && lesson.identificationExercises.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HiQuestionMarkCircle className="w-5 h-5 text-plum" />
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  Spot-the-Error Pattern Drill
                </h3>
                <span className="text-xs text-muted-label">
                  Click the sentence that has the mistake to verify your understanding
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {lesson.identificationExercises.map((exercise, exIdx) => {
                const exState = spotErrorStates[exercise.id] || {
                  selectedSentenceIdx: null,
                  isSubmitted: false,
                };

                return (
                  <div
                    key={exercise.id || exIdx}
                    className="imlaa-card overflow-hidden border border-plum/25 shadow-sm rounded-xl"
                  >
                    <div className="bg-plum text-white px-5 py-3 flex items-center justify-between">
                      <span className="font-bold text-sm tracking-wide">
                        Pattern Exercise #{exIdx + 1}
                      </span>
                      <span className="text-xs bg-white/20 text-white font-medium px-2 py-0.5 rounded">
                        Interactive
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 bg-white space-y-4">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900">
                        {exercise.prompt}
                      </h4>

                      <div className="space-y-3">
                        {exercise.sentences?.map((sent, sIdx) => {
                          const isSelected = exState.selectedSentenceIdx === sIdx;
                          const isCorrectOption = sent.isError;

                          let cardStyle = "bg-white border-plum/20 hover:border-plum hover:bg-plum/5 text-gray-900";

                          if (exState.isSubmitted) {
                            if (isCorrectOption) {
                              cardStyle = "border-emerald-600 bg-emerald-50 text-gray-900 ring-1 ring-emerald-600 font-medium";
                            } else if (isSelected && !isCorrectOption) {
                              cardStyle = "border-red-500 bg-red-50 text-gray-900 ring-1 ring-red-500 font-medium";
                            } else {
                              cardStyle = "bg-gray-50 border-gray-200 text-gray-500 opacity-60";
                            }
                          }

                          return (
                            <div
                              key={sIdx}
                              onClick={() =>
                                !exState.isSubmitted &&
                                handleSelectSpotSentence(exercise.id, sIdx)
                              }
                              className={`p-4 rounded-xl border transition-all text-sm leading-relaxed ${
                                !exState.isSubmitted ? "cursor-pointer" : "cursor-default"
                              } ${cardStyle}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span className="font-medium text-gray-900">{sent.text}</span>
                                {exState.isSubmitted && isCorrectOption && (
                                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-800 shrink-0 bg-emerald-100 px-2 py-0.5 rounded-md">
                                    <HiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Contains Error</span>
                                  </span>
                                )}
                                {exState.isSubmitted && isSelected && !isCorrectOption && (
                                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-red-800 shrink-0 bg-red-100 px-2 py-0.5 rounded-md">
                                    <HiXCircle className="w-3.5 h-3.5 text-red-600" />
                                    <span>Correct Sentence</span>
                                  </span>
                                )}
                              </div>

                              {exState.isSubmitted && (
                                <div className="mt-2.5 pt-2 border-t border-plum/10 text-xs text-gray-800">
                                  <span className="font-bold text-gray-900">Why: </span>
                                  {sent.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 8: QUICK CONCEPT MASTERY CHECK (MCQ) */}
        {lesson.quickCheck && lesson.quickCheck.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <HiSparkles className="w-5 h-5 text-plum" />
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  Quick Concept Check
                </h3>
                <span className="text-xs text-muted-label">
                  Test your understanding with these 2 quick questions
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {lesson.quickCheck.map((qc, qIdx) => {
                const selectedOptIdx = quickCheckAnswers[qIdx];
                const isAnswered = selectedOptIdx !== undefined;

                return (
                  <div
                    key={qIdx}
                    className="imlaa-card overflow-hidden border border-plum/25 shadow-sm rounded-xl"
                  >
                    <div className="bg-plum text-white px-5 py-3 flex items-center justify-between">
                      <span className="font-bold text-sm tracking-wide">
                        Quick Check #{qIdx + 1}
                      </span>
                      {isAnswered && (
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            selectedOptIdx === qc.correctIndex
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-red-100 text-red-900"
                          }`}
                        >
                          {selectedOptIdx === qc.correctIndex ? "Correct ✓" : "Needs Review ✗"}
                        </span>
                      )}
                    </div>

                    <div className="p-5 sm:p-6 bg-white space-y-4">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-relaxed">
                        {qc.question}
                      </h4>

                      <div className="space-y-2.5">
                        {qc.options?.map((option, optIdx) => {
                          const isSelected = selectedOptIdx === optIdx;
                          const isCorrect = optIdx === qc.correctIndex;

                          let btnClass = "bg-white border-plum/20 hover:border-plum hover:bg-plum/5 text-gray-900";

                          if (isAnswered) {
                            if (isCorrect) {
                              btnClass = "border-emerald-600 bg-emerald-50 text-gray-900 ring-1 ring-emerald-600 font-bold";
                            } else if (isSelected && !isCorrect) {
                              btnClass = "border-red-500 bg-red-50 text-gray-900 ring-1 ring-red-500 font-bold";
                            } else {
                              btnClass = "bg-gray-50 border-gray-200 text-gray-400 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={isAnswered}
                              onClick={() => handleSelectQuickCheck(qIdx, optIdx)}
                              className={`w-full p-3.5 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${btnClass} ${
                                !isAnswered ? "cursor-pointer" : "cursor-default"
                              }`}
                            >
                              <span className="font-medium text-gray-900">{option}</span>
                              {isAnswered && isCorrect && (
                                <HiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                              )}
                              {isAnswered && isSelected && !isCorrect && (
                                <HiXCircle className="w-5 h-5 text-red-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <div className="p-4 rounded-xl text-sm leading-relaxed border border-plum/15 bg-plum/5 text-gray-900 animate-slide-up">
                          <span className="font-bold text-plum block mb-1">
                            Explanation:
                          </span>
                          <p className="text-gray-900 font-medium">{qc.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM ACTION CARD */}
        <div className="imlaa-card p-8 border border-plum/25 rounded-2xl text-center space-y-4 shadow-sm bg-white">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-plum text-white flex items-center justify-center shadow-md">
            <HiSparkles className="w-6 h-6 text-amber-300" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Ready to Test Your Skills?
          </h3>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-gray-800 leading-relaxed font-normal">
            Take the timed 50-question interactive drill for{" "}
            <span className="font-bold text-plum">{lesson.title}</span>. Complete with real-time score tracking and detailed examiner answer keys.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStartDrill}
              className="imlaa-btn-primary py-3 px-6 text-sm sm:text-base font-bold flex items-center space-x-2 shadow-md cursor-pointer"
            >
              <span>Launch Practice Drill (50 Qs)</span>
              <HiArrowRight className="w-4 h-4" />
            </button>

            {nextLesson && (
              <button
                type="button"
                onClick={() => navigate(`/workspace/grammar/lesson/${nextLesson.id}`)}
                className="imlaa-btn-secondary py-3 px-5 text-sm sm:text-base font-semibold flex items-center space-x-2 cursor-pointer"
              >
                <span>Next Module: {nextLesson.title.split(":")[0].split("&")[0].trim()}</span>
                <HiArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
