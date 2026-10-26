import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { speakWithMicrosoftTTS, stopAudioPlayback } from "../utils/speechTts";
import {
  HiSpeakerWave,
  HiArrowPath,
  HiChevronLeft,
  HiChevronRight,
  HiCheckCircle,
  HiExclamationCircle,
  HiArrowLeft,
} from "react-icons/hi2";

// Corpus groups matching design mockup
const PARTS = ["All Active", "Uploaded"];

export default function VocabularyPage() {
  const [activePart, setActivePart] = useState("All Active");
  const [selectedGroup, setSelectedGroup] = useState(null); // When null => show Corpus Sets home page
  const [viewMode, setViewMode] = useState("sets"); // 'sets' | 'flashcard'
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spellingInput, setSpellingInput] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const { user } = useAuth();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [incorrectList, setIncorrectList] = useState([]);
  const [showPracticeIncorrectOnly, setShowPracticeIncorrectOnly] =
    useState(false);
  const [vocabStats, setVocabStats] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const vocabSessionStartRef = useRef(null);

  // Fetch dynamic vocabulary count statistics from backend
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get("/vocabulary/stats");
      if (res.data?.success) {
        setVocabStats(res.data);
      }
    } catch (err) {
      console.warn("Could not load vocab stats:", err);
    }
  }, []);

  // Fetch candidate's personal saved progress
  const fetchProgress = useCallback(async () => {
    if (!user?.accessId) return;
    try {
      const res = await apiClient.get("/vocabulary/progress", {
        params: { accessId: user.accessId },
      });
      if (res.data?.success && res.data.data) {
        setUserProgress(res.data.data);
      }
    } catch (err) {
      console.warn("Could not load user progress:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
    fetchProgress();
  }, [fetchStats, fetchProgress]);

  // Compute dynamic groups with real data counts and candidate's personal progress
  const dynamicGroups = [];

  // 1. Primary Academic Word List
  const academicCount = vocabStats?.byTopic?.["Academic Word List: Sublist A"] || 300;
  const academicMastered = userProgress?.masteredWords?.length || 0;
  const academicIncorrect = userProgress?.incorrectWords?.length || 0;
  const academicPercent = academicCount > 0 ? Math.min(100, Math.round((academicMastered / academicCount) * 100)) : 0;

  dynamicGroups.push({
    id: "academic-sublist-a",
    part: "All Active",
    title: "Academic Word List: Sublist A",
    description: "High-frequency academic stems, Latin morphemes & IELTS Band 8+ lexicon.",
    status: academicMastered === academicCount && academicCount > 0 ? "MASTERED" : academicMastered > 0 ? "IN PROGRESS" : "ACTIVE",
    wordsCount: academicCount,
    masteredCount: academicMastered,
    incorrectCount: academicIncorrect,
    progress: `${academicMastered} / ${academicCount} Mastered`,
    percent: academicPercent,
    accuracy: academicMastered + academicIncorrect > 0 ? `${Math.round((academicMastered / (academicMastered + academicIncorrect)) * 100)}% Accuracy` : null,
    hasIncorrect: academicIncorrect > 0,
  });

  // 2. Custom Uploaded Topics (Dynamic titles from user uploads)
  const uploadedList = vocabStats?.uploadedTopics || [];
  if (uploadedList.length > 0) {
    uploadedList.forEach((up, idx) => {
      const topicStats = userProgress?.progressByTopic?.[up.title] || { mastered: 0, incorrect: 0 };
      const percent = up.count > 0 ? Math.min(100, Math.round((topicStats.mastered / up.count) * 100)) : 0;
      dynamicGroups.push({
        id: `custom-uploaded-${idx}`,
        part: "Uploaded",
        title: up.title,
        description: `Custom uploaded corpus category with ${up.count} terms.`,
        status: topicStats.mastered >= up.count && up.count > 0 ? "MASTERED" : "UPLOADED",
        wordsCount: up.count,
        masteredCount: topicStats.mastered,
        incorrectCount: topicStats.incorrect,
        progress: `${topicStats.mastered} / ${up.count} Mastered`,
        percent,
        hasIncorrect: topicStats.incorrect > 0,
      });
    });
  } else {
    // Empty state card for Uploaded tab if nothing uploaded yet
    dynamicGroups.push({
      id: "custom-uploaded-empty",
      part: "Uploaded",
      title: "No Uploads Yet",
      description: "You haven't uploaded any custom topics yet. Go to 'Upload to Study' to add words.",
      status: "EMPTY",
      wordsCount: 0,
      masteredCount: 0,
      incorrectCount: 0,
      progress: "0 Words Available",
      percent: 0,
      hasIncorrect: false,
    });
  }

  // Load words when entering a flashcard group
  const loadWordsForGroup = useCallback(async (group) => {
    setLoading(true);
    setStatusFeedback(null);
    setSpellingInput("");
    setIsFlipped(false);
    setCurrentIndex(0);
    try {
      const isUploaded = group.part === "Uploaded";
      let params = {};

      if (isUploaded) {
        params = { topic: group.title };
      } else if (group.id === "academic-sublist-a") {
        params = { topic: "Academic Word List: Sublist A" };
      } else {
        params = { topic: group.title };
      }

      let res = await apiClient.get("/vocabulary", { params });
      let loadedWords = res.data?.data || [];

      // If specific topic title returned 0 words, fallback to all available words in DB
      if (loadedWords.length === 0) {
        const fallbackRes = await apiClient.get("/vocabulary");
        loadedWords = fallbackRes.data?.data || [];
      }

      if (loadedWords.length > 0) {
        setWords(loadedWords);
      } else {
        // Fallback default corpus if topic is completely empty
        setWords([
          {
            word: "Analysis",
            pos: "Noun",
            banglaMeaning: "বিশ্লেষণ",
            synonyms: ["Examination", "Investigation", "Evaluation"],
            exampleUsage: "A comprehensive analysis of the data revealed a significant correlation.",
          },
          {
            word: "Approach",
            pos: "Noun",
            banglaMeaning: "পদ্ধতি / দৃষ্টিভঙ্গি",
            synonyms: ["Method", "Strategy", "Perspective"],
            exampleUsage: "The researchers adopted a novel multidisciplinary approach.",
          },
          {
            word: "Fastidious",
            pos: "Adjective",
            banglaMeaning: "খুঁতখুঁতে / সহজে সন্তুষ্ট হয় না এমন",
            synonyms: ["Meticulous", "Punctilious", "Scrupulous"],
            exampleUsage: "He was fastidious about his appearance, always immaculate in pressed linen.",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load vocabulary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset progress for group
  const handleResetProgress = async (group) => {
    if (!user?.accessId) return;
    try {
      await apiClient.post("/vocabulary/progress/reset", {
        accessId: user.accessId,
        topic: group.title,
      });
      fetchProgress();
      setIncorrectList([]);
      handleStartGroup(group);
    } catch (err) {
      console.error("Failed to reset progress:", err);
    }
  };

  const handleStartGroup = useCallback(
    async (group, incorrectOnly = false) => {
      setSelectedGroup(group);
      setViewMode("flashcard");
      setShowPracticeIncorrectOnly(incorrectOnly);
      vocabSessionStartRef.current = Date.now();

      if (incorrectOnly && userProgress?.incorrectWords?.length > 0) {
        // Find full word objects matching user's incorrect list
        try {
          const res = await apiClient.get("/vocabulary", {
            params: { topic: group.title },
          });
          const allLoaded = res.data?.data || [];
          const filteredIncorrect = allLoaded.filter((w) =>
            userProgress.incorrectWords.includes(w.word),
          );
          setIncorrectList(filteredIncorrect);
        } catch {
          // Fallback
        }
      }

      loadWordsForGroup(group);
    },
    [userProgress, loadWordsForGroup],
  );

  const handleReturnToSets = () => {
    // Record study session duration to backend
    const startTime = vocabSessionStartRef.current;
    if (user?.accessId && startTime) {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      apiClient
        .post("/user/study-session", {
          accessId: user.accessId,
          durationSeconds,
        })
        .catch(() => {});
    }

    setSelectedGroup(null);
    setViewMode("sets");
    setIsFlipped(false);
    setSpellingInput("");
    setStatusFeedback(null);
    vocabSessionStartRef.current = null;
    fetchProgress();
  };

  const activeWords = showPracticeIncorrectOnly ? incorrectList : words;
  const currentWord = activeWords[currentIndex] || null;

  // Microsoft Christopher Neural Speech Audio
  const speakWord = useCallback(
    (targetWord) => {
      const wordToSpeak = targetWord || currentWord?.word;
      if (!wordToSpeak) return;

      speakWithMicrosoftTTS(wordToSpeak, {
        voice: "en-US-ChristopherNeural",
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [currentWord],
  );

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, []);

  useEffect(() => {
    if (viewMode === "flashcard" && currentWord && !isFlipped) {
      speakWord(currentWord.word);
    }
  }, [viewMode, currentIndex, currentWord, isFlipped, speakWord]);

  // Handle spelling check and persist to backend
  const handleSpellingSubmit = async (e) => {
    e.preventDefault();
    if (!currentWord || evaluating || !spellingInput.trim()) return;

    setEvaluating(true);
    const cleanInput = spellingInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();
    const isCorrect = cleanInput === cleanTarget;

    // Send answer to backend asynchronously to persist progress
    if (user?.accessId) {
      apiClient
        .post("/vocabulary/progress", {
          accessId: user.accessId,
          word: currentWord.word,
          isCorrect,
          topic: selectedGroup?.title || "Academic Word List: Sublist A",
        })
        .then((res) => {
          if (res.data?.success && res.data.data) {
            setUserProgress(res.data.data);
          }
        })
        .catch((err) => console.warn("Failed to persist word progress:", err));
    }

    if (isCorrect) {
      setStatusFeedback("correct");
      setTimeout(() => {
        setIsFlipped(true);
        setEvaluating(false);
      }, 550);
    } else {
      setStatusFeedback("incorrect");
      if (!incorrectList.some((w) => w.word === currentWord.word)) {
        setIncorrectList((prev) => [...prev, currentWord]);
      }
      setEvaluating(false);
    }
  };

  const [slideDirection, setSlideDirection] = useState("next"); // 'next' | 'prev'

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < activeWords.length - 1) {
        setSlideDirection("next");
        setIsFlipped(false);
        setSpellingInput("");
        setStatusFeedback(null);
        return prev + 1;
      }
      return prev;
    });
  }, [activeWords.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        setSlideDirection("prev");
        setIsFlipped(false);
        setSpellingInput("");
        setStatusFeedback(null);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  // Keyboard Shortcuts:
  // - Tab: Flip card
  // - ArrowRight: Move forward to next word
  // - ArrowLeft: Move backward to previous word
  useEffect(() => {
    if (viewMode !== "flashcard") return;

    const handleKeyDown = (e) => {
      // Tab key flips the flashcard
      if (e.key === "Tab") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
        return;
      }

      // If user is currently typing in an input text field and has text,
      // allow left/right cursor caret navigation within the input text unless modifier is pressed
      const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";

      if (e.key === "ArrowRight") {
        // If inside spelling input with text, don't hijack unless end of input or modifier key
        if (isInput && e.target.selectionStart !== e.target.selectionEnd) return;
        if (isInput && e.target.value.length > 0 && e.target.selectionStart < e.target.value.length) return;

        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        if (isInput && e.target.selectionStart !== e.target.selectionEnd) return;
        if (isInput && e.target.value.length > 0 && e.target.selectionStart > 0) return;

        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewMode, handleNext, handlePrev]);

  const filteredGroups = dynamicGroups.filter((g) => g.part === activePart);

  return (
    <div className="w-full flex flex-col space-y-7 animate-slide-up">
      {/* ==================================================== */}
      {/* 1. Header Bar: Title, Badge, Mode Switcher          */}
      {/* ==================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-black text-body-dark tracking-tight">
            Vocabulary
          </h1>
          <span className="imlaa-badge text-base py-1 px-3">
            {vocabStats?.totalCount || 300} Words Database
          </span>
        </div>

        {/* View Mode Toggle Button Group */}
        <div className="flex items-center space-x-2 bg-plum/5 p-1 rounded-xl border border-plum/20">
          <button
            type="button"
            onClick={handleReturnToSets}
            className={`px-4 py-2 rounded-lg text-base font-semibold transition-all cursor-pointer ${
              viewMode === "sets"
                ? "bg-plum text-white shadow-xs"
                : "text-muted-label hover:text-body-dark"
            }`}
          >
            Corpus Sets
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedGroup) {
                handleStartGroup(filteredGroups[0]);
              } else {
                setViewMode("flashcard");
              }
            }}
            className={`px-4 py-2 rounded-lg text-base font-semibold transition-all cursor-pointer ${
              viewMode === "flashcard"
                ? "bg-plum text-white shadow-xs"
                : "text-muted-label hover:text-body-dark"
            }`}
          >
            Active Dictation Flashcard
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. Corpus Sets View (Home Selection Page)            */}
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
            {filteredGroups.map((group) => {
              const isCompleted = group.status === "COMPLETED";
              const isMastered = group.status === "MASTERED";

              return (
                <div
                  key={group.id}
                  className="imlaa-card p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 border border-plum/20"
                >
                  <div>
                    {/* Top Status & Count */}
                    <div className="flex items-center justify-between text-base font-semibold mb-2">
                      <span
                        className={`tracking-wider ${
                          isMastered
                            ? "text-emerald-700"
                            : isCompleted
                              ? "text-plum"
                              : "text-muted-label"
                        }`}
                      >
                        {group.status}
                      </span>
                      <span className="text-body-dark font-medium">
                        {group.progress}
                      </span>
                    </div>

                    {/* Group Title */}
                    <h3 className="text-xl font-bold text-body-dark leading-snug mb-2">
                      {group.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base text-muted-label leading-relaxed mb-4">
                      {group.description}
                    </p>
                  </div>

                  <div>
                    {/* Dynamic Progress Bar for every card */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-label mb-1.5">
                        <span>Corpus Capacity</span>
                        <span>{group.percent}%</span>
                      </div>
                      <div className="w-full bg-plum/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-plum transition-all duration-500"
                          style={{ width: `${group.percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-plum/10">
                      {group.masteredCount > 0 || group.hasIncorrect ? (
                        <>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-body-dark">
                              {group.accuracy || `${group.percent}% Complete`}
                            </span>
                            <span className="text-xs text-muted-label">
                              {group.masteredCount} mastered
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleResetProgress(group)}
                              title="Reset progress for this topic"
                              className="imlaa-btn-secondary py-1.5 px-3 text-sm text-body-dark"
                            >
                              Reset
                            </button>
                            {group.hasIncorrect ? (
                              <button
                                type="button"
                                onClick={() => handleStartGroup(group, true)}
                                className="imlaa-btn-primary py-1.5 px-3 text-sm"
                              >
                                Practice Incorrect ({group.incorrectCount})
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartGroup(group, false)}
                                className="imlaa-btn-primary py-1.5 px-3 text-sm"
                              >
                                Continue
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-base text-muted-label font-medium">
                            {group.wordsCount} Lexemes
                          </span>
                          <button
                            type="button"
                            disabled={!group.wordsCount || group.wordsCount === 0}
                            onClick={() => handleStartGroup(group)}
                            className={`py-2 px-5 text-base rounded-lg font-semibold transition-all ${
                              !group.wordsCount || group.wordsCount === 0
                                ? "bg-plum/20 text-white/70 cursor-not-allowed opacity-50"
                                : "imlaa-btn-primary cursor-pointer"
                            }`}
                          >
                            {group.wordsCount === 0 ? "No Words" : "Start Topic"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. Active Dictation Flashcard View (With 3D Flip)    */}
      {/* ==================================================== */}
      {viewMode === "flashcard" && (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-6">
          {/* Header navigation bar inside flashcard */}
          <div className="w-full flex items-center justify-between text-base px-1">
            <button
              type="button"
              onClick={handleReturnToSets}
              className="inline-flex items-center space-x-2 text-plum hover:text-plum-hover font-semibold cursor-pointer"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back to Corpus Sets</span>
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
                Loading vocabulary...
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
              {/* Step indicator & Drill Filter */}
              <div className="flex flex-col space-y-2 px-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-base text-muted-label">
                  <div className="flex items-center space-x-3">
                    <span
                      key={currentIndex}
                      className="font-bold text-body-dark bg-plum/10 px-3 py-1 rounded-lg transition-all animate-slide-up"
                    >
                      Word {currentIndex + 1} of {activeWords.length}
                    </span>
                    {showPracticeIncorrectOnly && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                        Spelling Drill: Mistakes Only
                      </span>
                    )}
                  </div>

                {userProgress?.incorrectWords?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (showPracticeIncorrectOnly) {
                        setShowPracticeIncorrectOnly(false);
                        setCurrentIndex(0);
                        setIsFlipped(false);
                        setSpellingInput("");
                      } else {
                        // Switch to incorrect only
                        const filtered = words.filter((w) =>
                          userProgress.incorrectWords.includes(w.word),
                        );
                        if (filtered.length > 0) {
                          setIncorrectList(filtered);
                          setShowPracticeIncorrectOnly(true);
                          setCurrentIndex(0);
                          setIsFlipped(false);
                          setSpellingInput("");
                        }
                      }
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto ${
                      showPracticeIncorrectOnly
                        ? "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200"
                        : "bg-white text-muted-label border-plum/20 hover:border-plum hover:text-plum"
                    }`}
                  >
                    <span>{showPracticeIncorrectOnly ? "Exit Mistakes Drill (Show All)" : `Practice Mistakes Only (${userProgress.incorrectWords.length})`}</span>
                  </button>
                )}
                </div>
              </div>

              {/* 3D Animated Flip Card with Smooth Slide Transition on Navigation */}
              <div
                key={currentIndex}
                className={`imlaa-flip-card-container ${
                  slideDirection === "next"
                    ? "animate-card-next"
                    : "animate-card-prev"
                }`}
              >
                <div
                  className={`imlaa-flip-card-inner ${
                    isFlipped ? "is-flipped" : ""
                  }`}
                >
                  {/* FRONT FACE: Audio Dictation & Spelling */}
                  <div className="imlaa-flip-face imlaa-card p-8 sm:p-12 text-center bg-white border border-plum/20 shadow-md">
                    <div className="flex flex-col items-center space-y-6 my-auto">
                      {/* Audio Button with animated rings */}
                      <div className="flex flex-col items-center space-y-3">
                        <button
                          type="button"
                          onClick={() => speakWord()}
                          title="Click to Listen"
                          className="w-20 h-20 rounded-2xl bg-plum hover:bg-plum-hover text-white flex items-center justify-center transition shadow-md cursor-pointer active:scale-95 hover:shadow-lg"
                        >
                          <HiSpeakerWave
                            className={`w-10 h-10 ${
                              isSpeaking ? "animate-pulse" : ""
                            }`}
                          />
                        </button>
                        <span className="text-base text-muted-label font-medium">
                          Click to listen to pronunciation
                        </span>
                      </div>

                      {/* Input form */}
                      <form
                        onSubmit={handleSpellingSubmit}
                        className="w-full max-w-md flex flex-col space-y-4"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={spellingInput}
                          onChange={(e) => {
                            setSpellingInput(e.target.value);
                            if (statusFeedback) setStatusFeedback(null);
                          }}
                          placeholder="Type what you hear..."
                          className={`imlaa-input text-xl sm:text-2xl text-center py-4 px-6 tracking-wide transition-all ${
                            statusFeedback === "correct"
                              ? "border-emerald-600 focus:border-emerald-600 ring-2 ring-emerald-100"
                              : statusFeedback === "incorrect"
                                ? "border-rose-600 focus:border-rose-600 ring-2 ring-rose-100"
                                : ""
                          }`}
                        />

                        {/* Status Feedback */}
                        {statusFeedback === "incorrect" && (
                          <div className="flex items-center justify-center space-x-2 text-base text-rose-700 font-semibold animate-slide-up">
                            <HiExclamationCircle className="w-5 h-5" />
                            <span>
                              Incorrect spelling. Try listening again or reveal
                              study card.
                            </span>
                          </div>
                        )}
                        {statusFeedback === "correct" && (
                          <div className="flex items-center justify-center space-x-2 text-base text-emerald-700 font-semibold animate-slide-up">
                            <HiCheckCircle className="w-5 h-5" />
                            <span>Flawless! Flipping study card...</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={evaluating || !spellingInput.trim()}
                            className="imlaa-btn-primary flex-1 py-3.5 text-base"
                          >
                            Check Spelling
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsFlipped(true)}
                            className="imlaa-btn-secondary py-3.5 text-base flex items-center justify-center space-x-2"
                            title="Flip Card (Press Tab)"
                          >
                            <span>Flip Card</span>
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-plum/10 text-plum rounded border border-plum/20">
                              Tab
                            </kbd>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* BACK FACE: Structured 4-Row Study Card (Optimized 1 step smaller text & clean spacing) */}
                  <div className="imlaa-flip-face imlaa-flip-face-back imlaa-card p-6 sm:p-8 text-left bg-white border border-plum/20 shadow-md">
                    <div className="flex flex-col space-y-4 w-full">
                      {/* Row 1: Word + POS + Replay */}
                      <div className="flex items-center justify-between border-b border-plum/15 pb-3">
                        <div>
                          <h3 className="text-3xl sm:text-4xl font-black text-body-dark tracking-tight">
                            {currentWord.word}
                          </h3>
                          <span className="text-base text-plum font-semibold italic">
                            {currentWord.pos}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => speakWord()}
                          title="Replay pronunciation"
                          className="w-11 h-11 rounded-xl bg-plum/10 hover:bg-plum hover:text-white text-plum flex items-center justify-center transition cursor-pointer"
                        >
                          <HiSpeakerWave className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Row 2: Bengali Meaning */}
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-label font-bold mb-1">
                          Bengali Meaning
                        </div>
                        <div className="text-xl font-semibold text-body-dark">
                          {currentWord.banglaMeaning}
                        </div>
                      </div>

                      {/* Row 3: Synonyms */}
                      {currentWord.synonyms &&
                        currentWord.synonyms.length > 0 && (
                          <div>
                            <div className="text-xs uppercase tracking-wider text-muted-label font-bold mb-1.5">
                              Synonyms
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {currentWord.synonyms.map((syn, idx) => (
                                <span
                                  key={idx}
                                  className="imlaa-badge text-sm py-0.5 px-2.5 font-medium"
                                >
                                  {syn}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Row 4: Example Sentence */}
                      {currentWord.exampleUsage && (
                        <div className="p-3.5 rounded-xl bg-plum/5 border border-plum/20">
                          <div className="text-xs uppercase tracking-wider text-muted-label font-bold mb-1">
                            Usage Example
                          </div>
                          <p className="text-base text-body-dark italic leading-relaxed">
                            "{currentWord.exampleUsage}"
                          </p>
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-xs text-muted-label flex items-center gap-1.5">
                          Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-plum/10 text-plum rounded border border-plum/20">Tab</kbd> to flip back
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsFlipped(false)}
                          className="imlaa-btn-secondary text-sm py-2 px-4"
                        >
                          Flip Back to Practice
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Nav Controls */}
              <div className="flex flex-col space-y-2 pt-2">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="imlaa-btn-secondary py-3 px-5 text-base flex items-center space-x-2"
                    title="Previous Word (Left Arrow ←)"
                  >
                    <HiChevronLeft className="w-5 h-5" />
                    <span>Previous</span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-plum/10 text-plum rounded border border-plum/20">
                      ←
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIndex(0);
                      setIsFlipped(false);
                      setSpellingInput("");
                      setStatusFeedback(null);
                    }}
                    title="Restart group"
                    className="imlaa-btn-secondary py-3 px-4 text-base space-x-1.5"
                  >
                    <HiArrowPath className="w-5 h-5" />
                    <span>Restart</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex === activeWords.length - 1}
                    className="imlaa-btn-primary py-3 px-5 text-base flex items-center space-x-2"
                    title="Next Word (Right Arrow →)"
                  >
                    <span>Next Word</span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-white/20 text-white rounded border border-white/30">
                      →
                    </kbd>
                    <HiChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Subtle keyboard shortcut guide bar */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-label pt-1 select-none">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 font-mono bg-plum/5 text-plum rounded border border-plum/20">Tab</kbd> Flip
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 font-mono bg-plum/5 text-plum rounded border border-plum/20">←</kbd> Previous
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 font-mono bg-plum/5 text-plum rounded border border-plum/20">→</kbd> Next
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
