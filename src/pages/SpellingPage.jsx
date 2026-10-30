import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { speakWithMicrosoftTTS, stopAudioPlayback } from "../utils/speechTts";
import {
  HiSpeakerWave,
  HiChevronLeft,
  HiChevronRight,
  HiCheckCircle,
  HiExclamationCircle,
  HiArrowLeft,
  HiClock,
  HiSparkles,
  HiEye,
} from "react-icons/hi2";

const PARTS = ["All Active", "Listening Vocabs", "Uploaded"];

export default function SpellingPage() {
  const { user } = useAuth();

  // Navigation states: 'sets' | 'drill' | 'finished' | 'quiz'
  const [activePart, setActivePart] = useState("All Active");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState("sets");

  // Words & Drill States
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spellingInput, setSpellingInput] = useState("");
  const [statusFeedback, setStatusFeedback] = useState(null); // null | 'correct' | 'incorrect' | 'revealed'
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [slideDirection, setSlideDirection] = useState("next");

  // Per-Session Counts (Item 2)
  const [sessionCorrect, setSessionCorrect] = useState([]);
  const [sessionMisspelled, setSessionMisspelled] = useState([]);

  // Mistakes Only Mode
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [mistakesList, setMistakesList] = useState([]);

  // DB Progress
  const [vocabStats, setVocabStats] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const sessionStartTimeRef = useRef(null);

  // Random Quiz (Item 5)
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizQuantity, setQuizQuantity] = useState(10);
  const [quizTimerMinutes, setQuizTimerMinutes] = useState(0); // 0 = untimed
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizInput, setQuizInput] = useState("");
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const quizTimerRef = useRef(null);

  // Lock body scroll and listen for ESC key when quiz modal is open
  useEffect(() => {
    if (!quizModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setQuizModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [quizModalOpen]);

  // Fetch stats & user spelling progress
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get("/vocabulary/stats");
      if (res.data?.success) {
        setVocabStats(res.data);
      }
    } catch (err) {
      console.warn("Could not load stats:", err);
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    const targetId = user?.id || user?.accessId;
    if (!targetId) return;
    try {
      const res = await apiClient.get("/spelling/progress", {
        params: { userId: targetId, topic: selectedGroup?.title || "Academic Word List: Sublist A" },
      });
      if (res.data?.success && res.data.data) {
        setUserProgress(res.data.data);
      }
    } catch (err) {
      console.warn("Could not load spelling progress:", err);
    }
  }, [user, selectedGroup]);

  useEffect(() => {
    fetchStats();
    fetchProgress();
  }, [fetchStats, fetchProgress]);

  // Compute dynamic topic groups
  const dynamicGroups = [];
  const activeList = vocabStats?.activeTopics || [];
  if (activeList.length > 0) {
    activeList.forEach((act, idx) => {
      const totalWords = act.count || (act.title === "Academic Word List: Sublist A" ? 300 : 0);
      const mastered = userProgress?.masteredWords?.length || 0;
      const incorrect = userProgress?.incorrectWords?.length || 0;
      const percent = totalWords > 0 ? Math.min(100, Math.round((mastered / totalWords) * 100)) : 0;

      dynamicGroups.push({
        id: `spelling-active-${idx}`,
        part: "All Active",
        title: act.title,
        description: act.title === "Academic Word List: Sublist A"
          ? "High-frequency academic stems, Latin morphemes & IELTS Band 8+ spelling dictation."
          : `Active official curriculum corpus with ${totalWords} spelling terms.`,
        wordsCount: totalWords,
        masteredCount: mastered,
        incorrectCount: incorrect,
        percent,
        hasMistakes: incorrect > 0,
      });
    });
  } else {
    dynamicGroups.push({
      id: "spelling-academic-sublist-a",
      part: "All Active",
      title: "Academic Word List: Sublist A",
      description: "High-frequency academic stems, Latin morphemes & IELTS Band 8+ spelling dictation.",
      wordsCount: 300,
      masteredCount: 0,
      incorrectCount: 0,
      percent: 0,
      hasMistakes: false,
    });
  }

  // Listening Vocabs
  const listeningList = vocabStats?.listeningTopics || [];
  if (listeningList.length > 0) {
    listeningList.forEach((lis, idx) => {
      dynamicGroups.push({
        id: `spelling-listening-${idx}`,
        part: "Listening Vocabs",
        title: lis.title,
        description: `IELTS listening module vocabulary (${lis.count} lexemes).`,
        wordsCount: lis.count,
        masteredCount: 0,
        incorrectCount: 0,
        percent: 0,
        hasMistakes: false,
      });
    });
  }

  // Uploaded
  const uploadedList = vocabStats?.uploadedTopics || [];
  if (uploadedList.length > 0) {
    uploadedList.forEach((up, idx) => {
      dynamicGroups.push({
        id: `spelling-uploaded-${idx}`,
        part: "Uploaded",
        title: up.title,
        description: `Custom uploaded corpus category with ${up.count} terms.`,
        wordsCount: up.count,
        masteredCount: 0,
        incorrectCount: 0,
        percent: 0,
        hasMistakes: false,
      });
    });
  }

  // Load words for spelling drill
  const loadWordsForDrill = useCallback(async (group, onlyMistakes = false) => {
    setLoading(true);
    setSpellingInput("");
    setStatusFeedback(null);
    setHasAnsweredCurrent(false);
    try {
      const res = await apiClient.get("/vocabulary", {
        params: { topic: group.title },
      });
      let loaded = res.data?.data || [];
      if (loaded.length === 0) {
        const fb = await apiClient.get("/vocabulary");
        loaded = fb.data?.data || [];
      }

      if (onlyMistakes) {
        const mistakeSet = new Set(userProgress?.incorrectWords || []);
        const filtered = loaded.filter((w) => mistakeSet.has(w.word));
        setMistakesList(filtered);
        setWords(filtered.length > 0 ? filtered : loaded);
      } else {
        setWords(loaded);
      }
      setCurrentIndex(0);
    } catch (err) {
      console.error("Failed to load spelling words:", err);
    } finally {
      setLoading(false);
    }
  }, [userProgress]);

  const handleStartDrill = (group, isMistakes = false) => {
    setSelectedGroup(group);
    setMistakesOnly(isMistakes);
    setViewMode("drill");
    setSessionCorrect([]);
    setSessionMisspelled([]);
    sessionStartTimeRef.current = Date.now();
    loadWordsForDrill(group, isMistakes);
  };

  const handleReturnToSets = () => {
    if (sessionStartTimeRef.current && (user?.id || user?.accessId)) {
      const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
      apiClient.post("/user/study-session", {
        accessId: user?.id || user?.accessId,
        durationSeconds,
      }).catch(() => {});
    }

    setViewMode("sets");
    setSelectedGroup(null);
    setSpellingInput("");
    setStatusFeedback(null);
    setHasAnsweredCurrent(false);
    sessionStartTimeRef.current = null;
    fetchProgress();
  };

  const activeWords = mistakesOnly ? mistakesList : words;
  const currentWord = activeWords[currentIndex] || null;

  // Speak word with Christopher Neural + instant fallback
  const speakTargetWord = useCallback((overrideWord) => {
    const text = overrideWord || currentWord?.word;
    if (!text) return;
    speakWithMicrosoftTTS(text, {
      voice: "en-US-ChristopherNeural",
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [currentWord]);

  // Auto-speak word whenever current index changes in drill
  useEffect(() => {
    if (viewMode === "drill" && currentWord) {
      speakTargetWord(currentWord.word);
    }
  }, [viewMode, currentIndex, currentWord, speakTargetWord]);

  useEffect(() => {
    return () => {
      stopAudioPlayback();
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    };
  }, []);

  // Handle Check Spelling Form Submission (Item 2)
  const handleCheckSpelling = (e) => {
    if (e) e.preventDefault();
    if (!currentWord || evaluating || !spellingInput.trim()) return;

    setEvaluating(true);
    const cleanInput = spellingInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();
    const isCorrect = cleanInput === cleanTarget;

    setHasAnsweredCurrent(true);

    if (isCorrect) {
      setStatusFeedback("correct");
      setSessionCorrect((prev) => [...prev, currentWord.word]);
    } else {
      setStatusFeedback("incorrect");
      setSessionMisspelled((prev) => [...prev, currentWord.word]);
    }

    // Persist to Supabase
    const targetUserId = user?.id || user?.accessId;
    if (targetUserId) {
      apiClient.post("/spelling/progress", {
        userId: targetUserId,
        topic: selectedGroup?.title || "Academic Word List: Sublist A",
        word: currentWord.word,
        isCorrect,
        lastIndex: currentIndex,
      }).catch(() => {});
    }

    setEvaluating(false);
  };

  // Reveal Answer / Give up
  const handleRevealAnswer = () => {
    if (!currentWord || hasAnsweredCurrent) return;
    setStatusFeedback("revealed");
    setHasAnsweredCurrent(true);
    setSessionMisspelled((prev) => [...prev, currentWord.word]);

    const targetUserId = user?.id || user?.accessId;
    if (targetUserId) {
      apiClient.post("/spelling/progress", {
        userId: targetUserId,
        topic: selectedGroup?.title || "Academic Word List: Sublist A",
        word: currentWord.word,
        isCorrect: false,
        lastIndex: currentIndex,
      }).catch(() => {});
    }
  };

  // Advance to next word
  const handleNextWord = useCallback(() => {
    // CRUCIAL RULE (Item 2): CANNOT move forward without answering current spelling card!
    if (!hasAnsweredCurrent) {
      return;
    }

    if (currentIndex < activeWords.length - 1) {
      setSlideDirection("next");
      setCurrentIndex((prev) => prev + 1);
      setSpellingInput("");
      setStatusFeedback(null);
      setHasAnsweredCurrent(false);
    } else {
      setViewMode("finished");
    }
  }, [hasAnsweredCurrent, currentIndex, activeWords.length]);

  // Keyboard Navigation & Anti-Holding Bug Fix (Item 2)
  useEffect(() => {
    if (viewMode !== "drill") return;

    const handleKeyDown = (e) => {
      // FIX HOLDING KEYS: Stop auto-repeat
      if (e.repeat) return;

      const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";

      if (e.key === "ArrowRight") {
        if (isInput && e.target.selectionStart < e.target.value.length) return;
        e.preventDefault();
        // User cannot move forward without answering!
        if (hasAnsweredCurrent) {
          handleNextWord();
        }
      } else if (e.key === "ArrowLeft") {
        if (isInput && e.target.selectionStart > 0) return;
        e.preventDefault();
        if (currentIndex > 0) {
          setSlideDirection("prev");
          setCurrentIndex((prev) => prev - 1);
          setSpellingInput("");
          setStatusFeedback(null);
          setHasAnsweredCurrent(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, hasAnsweredCurrent, currentIndex, activeWords.length, handleNextWord]);

  // ==========================================================
  // RANDOM SPELLING QUIZ (Item 5)
  // ==========================================================
  const startRandomQuiz = (group) => {
    setSelectedGroup(group || dynamicGroups[0]);
    setQuizModalOpen(true);
  };

  const launchQuizSession = async () => {
    setQuizModalOpen(false);
    setLoading(true);
    try {
      const res = await apiClient.get("/vocabulary", {
        params: { topic: selectedGroup?.title },
      });
      const corpus = res.data?.data || [];
      if (corpus.length === 0) return;

      const shuffled = [...corpus].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(quizQuantity, shuffled.length));

      setQuizQuestions(selected);
      setQuizIndex(0);
      setQuizScore(0);
      setQuizInput("");
      setQuizFinished(false);

      if (quizTimerMinutes > 0) {
        setQuizTimeRemaining(quizTimerMinutes * 60);
      } else {
        setQuizTimeRemaining(0);
      }

      setViewMode("quiz");

      // Auto speak first question
      if (selected[0]) {
        setTimeout(() => speakWithMicrosoftTTS(selected[0].word), 300);
      }

      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
      if (quizTimerMinutes > 0) {
        quizTimerRef.current = setInterval(() => {
          setQuizTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(quizTimerRef.current);
              setQuizFinished(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    if (!quizInput.trim()) return;

    const q = quizQuestions[quizIndex];
    const isCorrect = quizInput.trim().toLowerCase() === q.word.trim().toLowerCase();
    if (isCorrect) setQuizScore((prev) => prev + 1);

    setQuizInput("");
    if (quizIndex < quizQuestions.length - 1) {
      const nextQ = quizQuestions[quizIndex + 1];
      setQuizIndex((prev) => prev + 1);
      setTimeout(() => speakWithMicrosoftTTS(nextQ.word), 300);
    } else {
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
      setQuizFinished(true);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const filteredGroups = dynamicGroups.filter((g) => g.part === activePart);

  return (
    <div className="w-full flex flex-col space-y-7 animate-slide-up">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-plum/15">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-body-dark tracking-tight">
              Spelling Dictation
            </h1>
            <span className="imlaa-badge text-xs sm:text-base py-0.5 sm:py-1 px-2.5 sm:px-3">
              Acoustic Input
            </span>
          </div>
          <p className="text-xs sm:text-base text-muted-label mt-1">
            Listen to native pronunciations, transcribe accurately, and eliminate misspellings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => startRandomQuiz(filteredGroups[0])}
          className="imlaa-btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-4 flex items-center space-x-2 self-start sm:self-auto min-h-11"
        >
          <HiSparkles className="w-4 h-4 text-plum shrink-0" />
          <span>Random Spelling Quiz</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* 2. CORPUS SETS VIEW                                  */}
      {/* ==================================================== */}
      {viewMode === "sets" && (
        <div className="flex flex-col space-y-6">
          {/* Part Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {PARTS.map((part) => (
              <button
                key={part}
                type="button"
                onClick={() => setActivePart(part)}
                className={`imlaa-tab-btn text-base px-5 py-2.5 ${
                  activePart === part ? "active" : ""
                }`}
              >
                {part}
              </button>
            ))}
          </div>

          {/* Vocabulary Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="imlaa-card p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 border border-plum/20"
              >
                <div>
                  <div className="flex items-center justify-between text-base font-semibold mb-2">
                    <span className="text-muted-label font-semibold">
                      {group.wordsCount} Terms
                    </span>
                    {group.hasMistakes && (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs font-bold">
                        {group.incorrectCount} Misspelled
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-body-dark leading-snug mb-2">
                    {group.title}
                  </h3>
                  <p className="text-base text-muted-label leading-relaxed mb-4">
                    {group.description}
                  </p>
                </div>

                <div>
                  {/* Progress Indicator */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-label mb-1.5">
                      <span>Spelling Accuracy</span>
                      <span>{group.percent}%</span>
                    </div>
                    <div className="w-full bg-plum/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-plum transition-all duration-500"
                        style={{ width: `${group.percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-plum/10 gap-2">
                    {group.hasMistakes ? (
                      <button
                        type="button"
                        onClick={() => handleStartDrill(group, true)}
                        className="imlaa-btn-secondary text-xs py-2 px-3 text-rose-700 font-bold border-rose-300"
                      >
                        Mistakes ({group.incorrectCount})
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startRandomQuiz(group)}
                        className="imlaa-btn-secondary text-xs py-2 px-3 text-plum"
                      >
                        Quiz
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!group.wordsCount || group.wordsCount === 0}
                      onClick={() => handleStartDrill(group, false)}
                      className="imlaa-btn-primary py-2 px-4 text-sm font-semibold"
                    >
                      Start Spelling
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. ACTIVE SPELLING DRILL VIEW                        */}
      {/* ==================================================== */}
      {viewMode === "drill" && (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-6">
          {/* Header Bar inside drill */}
          <div className="w-full flex items-center justify-between text-base px-1">
            <button
              type="button"
              onClick={handleReturnToSets}
              className="inline-flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold cursor-pointer"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back to Sets</span>
            </button>

            {selectedGroup && (
              <span className="imlaa-badge text-base">
                {selectedGroup.title}
              </span>
            )}
          </div>

          {loading ? (
            <div className="imlaa-card w-full p-16 text-center animate-pulse">
              <div className="text-xl text-plum font-semibold">
                Loading spelling list...
              </div>
            </div>
          ) : !currentWord ? (
            <div className="imlaa-card w-full p-12 text-center space-y-4">
              <div className="text-2xl font-bold text-body-dark">
                No words in this drill
              </div>
              <button
                type="button"
                onClick={handleReturnToSets}
                className="imlaa-btn-primary text-base"
              >
                Choose Another Topic
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col space-y-6">
              {/* Step Counter */}
              <div className="w-full flex items-center justify-between px-1">
                <span className="text-base font-bold text-body-dark bg-white px-3.5 py-1.5 rounded-xl border border-plum/20 shadow-xs">
                  Word <span className="text-plum">{currentIndex + 1}</span> of {activeWords.length}
                </span>

                <span className="text-xs text-muted-label font-medium">
                  {currentWord.pos || "Lexeme"}
                </span>
              </div>

              {/* Main Dictation Card */}
              <div
                key={currentIndex}
                className={`imlaa-card p-8 sm:p-12 text-center bg-white border border-plum/20 shadow-md flex flex-col items-center space-y-6 ${
                  slideDirection === "next" ? "animate-slide-next" : "animate-slide-prev"
                }`}
              >
                {/* Large Audio Speaker Button */}
                <div className="flex flex-col items-center space-y-3">
                  <button
                    type="button"
                    onClick={() => speakTargetWord()}
                    title="Click to Listen"
                    className="w-20 h-20 rounded-2xl bg-plum hover:bg-plum-hover text-white flex items-center justify-center transition shadow-md cursor-pointer active:scale-95"
                  >
                    <HiSpeakerWave className={`w-10 h-10 ${isSpeaking ? "animate-pulse" : ""}`} />
                  </button>
                  <span className="text-sm text-muted-label font-medium">
                    Click to hear the pronunciation
                  </span>
                </div>

                {/* Form Input */}
                <form
                  onSubmit={handleCheckSpelling}
                  className="w-full max-w-md flex flex-col space-y-4"
                >
                  <input
                    type="text"
                    autoFocus
                    disabled={hasAnsweredCurrent}
                    value={spellingInput}
                    onChange={(e) => setSpellingInput(e.target.value)}
                    placeholder="Type what you hear..."
                    className={`imlaa-input text-xl sm:text-2xl text-center py-4 px-6 tracking-wide transition-all ${
                      statusFeedback === "correct"
                        ? "border-emerald-600 focus:border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/30"
                        : statusFeedback === "incorrect" || statusFeedback === "revealed"
                        ? "border-rose-600 focus:border-rose-600 ring-2 ring-rose-100 bg-rose-50/30"
                        : ""
                    }`}
                  />

                  {/* Feedback Message */}
                  {statusFeedback === "correct" && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left space-y-2 animate-slide-up">
                      <div className="flex items-center space-x-2 text-emerald-800 font-bold text-base">
                        <HiCheckCircle className="w-5 h-5" />
                        <span>Flawless Spelling!</span>
                      </div>
                      <div className="text-sm text-emerald-900">
                        <strong>{currentWord.word}</strong>: {currentWord.banglaMeaning}
                      </div>
                    </div>
                  )}

                  {(statusFeedback === "incorrect" || statusFeedback === "revealed") && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left space-y-2 animate-slide-up">
                      <div className="flex items-center space-x-2 text-rose-800 font-bold text-base">
                        <HiExclamationCircle className="w-5 h-5" />
                        <span>Correct Spelling: <strong className="text-lg underline ml-1">{currentWord.word}</strong></span>
                      </div>
                      <div className="text-sm text-rose-900">
                        Meaning: {currentWord.banglaMeaning}
                      </div>
                      {currentWord.exampleUsage && (
                        <p className="text-xs text-rose-700 italic">
                          "{currentWord.exampleUsage}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full">
                    {!hasAnsweredCurrent ? (
                      <>
                        <button
                          type="submit"
                          disabled={evaluating || !spellingInput.trim()}
                          className="imlaa-btn-primary w-full sm:flex-1 py-3 sm:py-3.5 text-sm sm:text-base font-bold min-h-11"
                        >
                          Check Spelling
                        </button>
                        <button
                          type="button"
                          onClick={handleRevealAnswer}
                          className="imlaa-btn-secondary w-full sm:w-auto py-3 sm:py-3.5 px-4 text-xs sm:text-sm flex items-center justify-center space-x-1.5 min-h-11"
                          title="Reveal correct spelling"
                        >
                          <HiEye className="w-4 h-4 shrink-0" />
                          <span>Reveal</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextWord}
                        className="imlaa-btn-primary w-full py-3 sm:py-3.5 text-sm sm:text-base font-bold flex items-center justify-center space-x-2 min-h-11"
                      >
                        <span>{currentIndex === activeWords.length - 1 ? "Complete Session" : "Next Word"}</span>
                        <HiChevronRight className="w-5 h-5 shrink-0" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Anti-Skip Notice (Item 2 Rule) */}
                {!hasAnsweredCurrent && (
                  <p className="text-xs text-muted-label text-center">
                    Answer or click "Reveal" to advance to the next word.
                  </p>
                )}
              </div>

              {/* Bottom Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 w-full">
                <button
                  type="button"
                  onClick={() => {
                    if (currentIndex > 0) {
                      setSlideDirection("prev");
                      setCurrentIndex((prev) => prev - 1);
                      setSpellingInput("");
                      setStatusFeedback(null);
                      setHasAnsweredCurrent(false);
                    }
                  }}
                  disabled={currentIndex === 0}
                  className="imlaa-btn-secondary py-2.5 sm:py-3 px-4 sm:px-5 text-sm sm:text-base flex items-center justify-center space-x-2 w-full sm:w-auto min-h-11"
                >
                  <HiChevronLeft className="w-5 h-5 shrink-0" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextWord}
                  disabled={!hasAnsweredCurrent}
                  className={`py-2.5 sm:py-3 px-5 sm:px-6 text-sm sm:text-base font-bold rounded-xl flex items-center justify-center space-x-2 transition w-full sm:w-auto min-h-11 ${
                    !hasAnsweredCurrent
                      ? "bg-plum/20 text-white/60 cursor-not-allowed"
                      : "imlaa-btn-primary cursor-pointer"
                  }`}
                  title={!hasAnsweredCurrent ? "Please answer the current word first" : "Next Word"}
                >
                  <span>{currentIndex === activeWords.length - 1 ? "Finish" : "Next Word"}</span>
                  <HiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. FINISH SUMMARY SCREEN (Item 2 Requirement)        */}
      {/* ==================================================== */}
      {viewMode === "finished" && (
        <div className="w-full max-w-xl mx-auto imlaa-card p-8 sm:p-10 text-center space-y-7 animate-slide-up border border-plum/20 shadow-lg bg-white">
          <div className="w-16 h-16 rounded-full bg-plum/10 text-plum mx-auto flex items-center justify-center">
            <HiSparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-body-dark">
              Spelling Session Complete!
            </h2>
            <p className="text-base text-muted-label">
              Detailed transcription breakdown for {selectedGroup?.title}.
            </p>
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-4xl font-black text-emerald-700">
                {sessionCorrect.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mt-1">
                Correctly Spelled
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <div className="text-4xl font-black text-rose-700">
                {sessionMisspelled.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-800 mt-1">
                Misspelled
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-plum/15">
            {sessionMisspelled.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const mistakeWords = words.filter((w) =>
                    sessionMisspelled.includes(w.word)
                  );
                  setMistakesList(mistakeWords);
                  setMistakesOnly(true);
                  setCurrentIndex(0);
                  setSpellingInput("");
                  setStatusFeedback(null);
                  setHasAnsweredCurrent(false);
                  setSessionCorrect([]);
                  setSessionMisspelled([]);
                  setViewMode("drill");
                }}
                className="imlaa-btn-primary w-full sm:w-auto py-3 px-6 text-base font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Practice Mistakes ({sessionMisspelled.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMistakesOnly(false);
                setCurrentIndex(0);
                setSpellingInput("");
                setStatusFeedback(null);
                setHasAnsweredCurrent(false);
                setSessionCorrect([]);
                setSessionMisspelled([]);
                setViewMode("drill");
              }}
              className="imlaa-btn-secondary w-full sm:w-auto py-3 px-6 text-base font-semibold"
            >
              Start Over
            </button>

            <button
              type="button"
              onClick={handleReturnToSets}
              className="imlaa-btn-secondary w-full sm:w-auto py-3 px-6 text-base font-semibold"
            >
              Corpus Sets
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. RANDOM SPELLING QUIZ (Item 5)                     */}
      {/* ==================================================== */}
      {viewMode === "quiz" && (
        <div className="w-full max-w-2xl mx-auto flex flex-col space-y-6">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                if (quizTimerRef.current) clearInterval(quizTimerRef.current);
                setViewMode("sets");
              }}
              className="inline-flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold cursor-pointer"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Exit Quiz</span>
            </button>

            {quizTimerMinutes > 0 && (
              <div className="flex items-center space-x-2 bg-plum/10 text-plum font-mono font-bold px-3 py-1 rounded-xl">
                <HiClock className="w-5 h-5" />
                <span>{formatTimer(quizTimeRemaining)}</span>
              </div>
            )}
          </div>

          {!quizFinished && quizQuestions.length > 0 ? (
            <div className="imlaa-card p-8 bg-white border border-plum/20 shadow-md space-y-6 text-center">
              <div className="flex items-center justify-between text-sm text-muted-label font-semibold">
                <span>
                  Question {quizIndex + 1} of {quizQuestions.length}
                </span>
                <span>Score: {quizScore}</span>
              </div>

              <div className="py-4 space-y-3">
                <button
                  type="button"
                  onClick={() => speakWithMicrosoftTTS(quizQuestions[quizIndex].word)}
                  className="w-20 h-20 rounded-2xl bg-plum hover:bg-plum-hover text-white mx-auto flex items-center justify-center transition shadow-md cursor-pointer"
                >
                  <HiSpeakerWave className="w-10 h-10" />
                </button>
                <div className="text-sm text-muted-label font-medium">
                  Listen to the pronunciation and spell it below:
                </div>
              </div>

              <form onSubmit={handleQuizSubmit} className="max-w-md mx-auto space-y-4">
                <input
                  type="text"
                  autoFocus
                  value={quizInput}
                  onChange={(e) => setQuizInput(e.target.value)}
                  placeholder="Type your spelling..."
                  className="imlaa-input text-xl text-center py-3.5 px-6"
                />
                <button
                  type="submit"
                  disabled={!quizInput.trim()}
                  className="imlaa-btn-primary w-full py-3.5 text-base font-bold"
                >
                  Submit & Next
                </button>
              </form>
            </div>
          ) : (
            <div className="imlaa-card p-8 bg-white border border-plum/20 shadow-md text-center space-y-6">
              <h2 className="text-3xl font-black text-body-dark">Spelling Quiz Completed!</h2>
              <div className="text-5xl font-black text-plum">
                {quizScore} / {quizQuestions.length}
              </div>
              <p className="text-base text-muted-label">
                Accuracy: {Math.round((quizScore / (quizQuestions.length || 1)) * 100)}%
              </p>

              <div className="flex items-center justify-center gap-3 pt-4 border-t border-plum/10">
                <button
                  type="button"
                  onClick={launchQuizSession}
                  className="imlaa-btn-primary py-3 px-6 text-base font-bold"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("sets")}
                  className="imlaa-btn-secondary py-3 px-6 text-base"
                >
                  Return to Sets
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. RANDOM QUIZ CONFIGURATION MODAL (Item 5)          */}
      {/* ==================================================== */}
      {quizModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setQuizModalOpen(false);
            }}
          >
            <div
              className="imlaa-card w-full max-w-md p-6 bg-white border border-plum/20 shadow-2xl space-y-6 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black text-body-dark">
                Random Spelling Quiz
              </h3>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-label block mb-2">
                  Number of Dictation Words
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 50].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setQuizQuantity(qty)}
                      className={`py-2 rounded-xl font-bold border transition ${
                        quizQuantity === qty
                          ? "bg-plum text-white border-plum"
                          : "border-plum/20 text-body-dark hover:bg-plum/5"
                      }`}
                    >
                      {qty} Words
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-label block mb-2">
                  Timer Limit
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Untimed", value: 0 },
                    { label: "1 Min", value: 1 },
                    { label: "2 Min", value: 2 },
                    { label: "5 Min", value: 5 },
                    { label: "10 Min", value: 10 },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setQuizTimerMinutes(t.value)}
                      className={`py-2 rounded-xl font-bold border transition ${
                        quizTimerMinutes === t.value
                          ? "bg-plum text-white border-plum"
                          : "border-plum/20 text-body-dark hover:bg-plum/5"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-plum/10">
                <button
                  type="button"
                  onClick={() => setQuizModalOpen(false)}
                  className="imlaa-btn-secondary py-2 px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={launchQuizSession}
                  className="imlaa-btn-primary py-2 px-5 text-sm font-bold"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
