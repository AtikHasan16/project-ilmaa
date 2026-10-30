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
  HiXCircle,
  HiClock,
  HiArrowLeft,
  HiSparkles,
  HiLanguage,
} from "react-icons/hi2";

// Corpus groups matching design
const PARTS = ["All Active", "Listening Vocabs", "Uploaded"];

// Multi-language translation dictionary for common academic roots (Item 3)
const LANGUAGE_TRANSLATIONS = {
  bn: "বাংলা (Bengali)",
  hi: "हिन्दी (Hindi)",
  ur: "اردو (Urdu)",
  ar: "العربية (Arabic)",
  es: "Español (Spanish)",
  fr: "Français (French)",
};

export default function FlashcardPage() {
  const { user } = useAuth();

  // Navigation & View States: 'sets' | 'drill' | 'finished' | 'quiz'
  const [activePart, setActivePart] = useState("All Active");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState("sets");

  // Corpus & Word States
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState("next");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Preferred meaning language
  const [selectedLanguage, setSelectedLanguage] = useState("bn");

  // Flashcard Answer Tracking (Item 2)
  // Per-session counters
  const [sessionKnew, setSessionKnew] = useState([]);
  const [sessionUnknown, setSessionUnknown] = useState([]);
  const [sessionForgot, setSessionForgot] = useState([]);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);

  // Persistent Progress Data from DB
  const [vocabStats, setVocabStats] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const sessionStartTimeRef = useRef(null);

  // Practice Mistakes Mode
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const [mistakesList, setMistakesList] = useState([]);

  // Random Quiz States (Item 5)
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizQuantity, setQuizQuantity] = useState(10); // 10 | 20 | 50
  const [quizTimerMinutes, setQuizTimerMinutes] = useState(0); // 0 (untimed) | 1 | 2 | 5 | 10
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizUserAnswers, setQuizUserAnswers] = useState([]);
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

  // Fetch vocabulary statistics
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

  // Fetch candidate's flashcard progress
  const fetchProgress = useCallback(async () => {
    const targetId = user?.id || user?.accessId;
    if (!targetId) return;
    try {
      const res = await apiClient.get("/flashcard/progress", {
        params: { userId: targetId, topic: selectedGroup?.title || "Academic Word List: Sublist A" },
      });
      if (res.data?.success && res.data.data) {
        setUserProgress(res.data.data);
      }
    } catch (err) {
      console.warn("Could not load flashcard progress:", err);
    }
  }, [user, selectedGroup]);

  useEffect(() => {
    fetchStats();
    fetchProgress();
  }, [fetchStats, fetchProgress]);

  // Compute dynamic groups
  const dynamicGroups = [];

  // 1. All Active word lists
  const activeList = vocabStats?.activeTopics || [];
  if (activeList.length > 0) {
    activeList.forEach((act, idx) => {
      const totalWords = act.count || (act.title === "Academic Word List: Sublist A" ? 300 : 0);
      const known = userProgress?.knownWords?.length || 0;
      const percent = totalWords > 0 ? Math.min(100, Math.round((known / totalWords) * 100)) : 0;
      const mistakesCount = (userProgress?.unknownWords?.length || 0) + (userProgress?.forgotWords?.length || 0);

      dynamicGroups.push({
        id: `active-${idx}-${act.title}`,
        part: "All Active",
        title: act.title,
        description: act.title === "Academic Word List: Sublist A"
          ? "High-frequency academic stems, Latin morphemes & IELTS Band 8+ lexicon."
          : `Active official curriculum corpus with ${totalWords} lexemes.`,
        wordsCount: totalWords,
        knownCount: known,
        mistakesCount,
        percent,
        hasMistakes: mistakesCount > 0,
      });
    });
  } else {
    dynamicGroups.push({
      id: "academic-sublist-a",
      part: "All Active",
      title: "Academic Word List: Sublist A",
      description: "High-frequency academic stems, Latin morphemes & IELTS Band 8+ lexicon.",
      wordsCount: vocabStats?.byTopic?.["Academic Word List: Sublist A"] || 300,
      knownCount: userProgress?.knownWords?.length || 0,
      mistakesCount: (userProgress?.unknownWords?.length || 0) + (userProgress?.forgotWords?.length || 0),
      percent: 0,
      hasMistakes: false,
    });
  }

  // 2. Listening Vocabs
  const listeningList = vocabStats?.listeningTopics || [];
  if (listeningList.length > 0) {
    listeningList.forEach((lis, idx) => {
      dynamicGroups.push({
        id: `listening-${idx}-${lis.title}`,
        part: "Listening Vocabs",
        title: lis.title,
        description: `IELTS listening module vocabulary (${lis.count} lexemes).`,
        wordsCount: lis.count,
        knownCount: 0,
        mistakesCount: 0,
        percent: 0,
        hasMistakes: false,
      });
    });
  } else {
    dynamicGroups.push({
      id: "listening-empty",
      part: "Listening Vocabs",
      title: "No Listening Vocabs Yet",
      description: "Upload topics like 'Studying university/college' or 'Subjects' via Upload to Study.",
      wordsCount: 0,
      knownCount: 0,
      mistakesCount: 0,
      percent: 0,
      hasMistakes: false,
    });
  }

  // 3. Uploaded Topics
  const uploadedList = vocabStats?.uploadedTopics || [];
  if (uploadedList.length > 0) {
    uploadedList.forEach((up, idx) => {
      dynamicGroups.push({
        id: `uploaded-${idx}-${up.title}`,
        part: "Uploaded",
        title: up.title,
        description: `Custom uploaded corpus category with ${up.count} terms.`,
        wordsCount: up.count,
        knownCount: 0,
        mistakesCount: 0,
        percent: 0,
        hasMistakes: false,
      });
    });
  }

  // Load words when starting drill
  const loadWordsForDrill = useCallback(async (group, onlyMistakes = false) => {
    setLoading(true);
    setIsFlipped(false);
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
        const mistakeSet = new Set([
          ...(userProgress?.unknownWords || []),
          ...(userProgress?.forgotWords || []),
        ]);
        const filtered = loaded.filter((w) => mistakeSet.has(w.word));
        setMistakesList(filtered);
        setWords(filtered.length > 0 ? filtered : loaded);
      } else {
        setWords(loaded);
      }
      setCurrentIndex(0);
    } catch (err) {
      console.error("Failed to load flashcard words:", err);
    } finally {
      setLoading(false);
    }
  }, [userProgress]);

  // Start Flashcard Practice
  const handleStartDrill = (group, isMistakes = false) => {
    setSelectedGroup(group);
    setMistakesOnly(isMistakes);
    setViewMode("drill");
    setSessionKnew([]);
    setSessionUnknown([]);
    setSessionForgot([]);
    sessionStartTimeRef.current = Date.now();
    loadWordsForDrill(group, isMistakes);
  };

  // Return to Corpus Sets
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
    setIsFlipped(false);
    setHasAnsweredCurrent(false);
    sessionStartTimeRef.current = null;
    fetchProgress();
  };

  const activeWords = mistakesOnly ? mistakesList : words;
  const currentWord = activeWords[currentIndex] || null;

  // Christopher Neural Audio Speech
  const speakCurrentWord = useCallback((overrideWord) => {
    const text = overrideWord || currentWord?.word;
    if (!text) return;
    speakWithMicrosoftTTS(text, {
      voice: "en-US-ChristopherNeural",
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [currentWord]);

  useEffect(() => {
    return () => {
      stopAudioPlayback();
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    };
  }, []);

  // Record Flashcard Rating (Item 2: Knew, Didn't Know, Forgot)
  const handleRateCard = useCallback(async (status) => {
    if (!currentWord || hasAnsweredCurrent) return;
    setHasAnsweredCurrent(true);

    const wordText = currentWord.word;
    if (status === "knew") {
      setSessionKnew((prev) => [...prev, wordText]);
    } else if (status === "forgot") {
      setSessionForgot((prev) => [...prev, wordText]);
    } else {
      setSessionUnknown((prev) => [...prev, wordText]);
    }

    // Persist to Supabase
    const targetUserId = user?.id || user?.accessId;
    if (targetUserId) {
      apiClient.post("/flashcard/progress", {
        userId: targetUserId,
        topic: selectedGroup?.title || "Academic Word List: Sublist A",
        word: wordText,
        status,
        lastIndex: currentIndex,
      }).catch(() => {});
    }

    // Auto-advance after 450ms smooth delay
    setTimeout(() => {
      if (currentIndex < activeWords.length - 1) {
        setSlideDirection("next");
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setHasAnsweredCurrent(false);
      } else {
        // Last card reached -> Finish Screen
        setViewMode("finished");
      }
    }, 450);
  }, [currentWord, hasAnsweredCurrent, user, selectedGroup, currentIndex, activeWords.length]);

  // Keyboard Navigation & Anti-Holding optimization (Item 2)
  useEffect(() => {
    if (viewMode !== "drill") return;

    const handleKeyDown = (e) => {
      // FIX HOLDING KEYS: Stop browser auto-repeat when key is held down!
      if (e.repeat) return;

      // Flip card: Space or Tab
      if (e.key === "Tab" || e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
        return;
      }

      // Ratings when flipped: 1 = Didn't Know, 2 = Forgot, 3 = I Knew It
      if (isFlipped && !hasAnsweredCurrent) {
        if (e.key === "1") {
          e.preventDefault();
          handleRateCard("unknown");
          return;
        }
        if (e.key === "2") {
          e.preventDefault();
          handleRateCard("forgot");
          return;
        }
        if (e.key === "3") {
          e.preventDefault();
          handleRateCard("knew");
          return;
        }
      }

      // Navigation: Prevent skipping ahead without answering!
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (!hasAnsweredCurrent) {
          // If not answered, prompt user or auto-flip
          if (!isFlipped) {
            setIsFlipped(true);
          }
          return;
        }
        if (currentIndex < activeWords.length - 1) {
          setSlideDirection("next");
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
          setHasAnsweredCurrent(false);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) {
          setSlideDirection("prev");
          setCurrentIndex((prev) => prev - 1);
          setIsFlipped(false);
          setHasAnsweredCurrent(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, isFlipped, hasAnsweredCurrent, currentIndex, activeWords.length, handleRateCard]);

  // ==========================================================
  // RANDOM QUIZ ENGINE (Item 5)
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

      // Shuffle corpus & pick quantity
      const shuffled = [...corpus].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(quizQuantity, shuffled.length));

      // Generate 4-option multiple choice for each question
      const generated = selected.map((item) => {
        const distractors = corpus
          .filter((c) => c.word !== item.word && c.banglaMeaning)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map((c) => c.banglaMeaning);

        const options = [...distractors, item.banglaMeaning].sort(() => 0.5 - Math.random());

        return {
          word: item.word,
          pos: item.pos,
          correctAnswer: item.banglaMeaning,
          options,
        };
      });

      setQuizQuestions(generated);
      setQuizIndex(0);
      setQuizScore(0);
      setQuizUserAnswers([]);
      setQuizFinished(false);

      if (quizTimerMinutes > 0) {
        setQuizTimeRemaining(quizTimerMinutes * 60);
      } else {
        setQuizTimeRemaining(0);
      }

      setViewMode("quiz");

      // Start Countdown Timer
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

  const handleQuizAnswer = (chosen) => {
    const q = quizQuestions[quizIndex];
    const isCorrect = chosen === q.correctAnswer;
    if (isCorrect) setQuizScore((prev) => prev + 1);

    setQuizUserAnswers((prev) => [
      ...prev,
      { question: q.word, chosen, correct: q.correctAnswer, isCorrect },
    ]);

    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
    } else {
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
      setQuizFinished(true);
    }
  };

  // Format Timer mm:ss
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
              Vocabulary Flashcards
            </h1>
            <span className="imlaa-badge text-xs sm:text-base py-0.5 sm:py-1 px-2.5 sm:px-3">
              {vocabStats?.totalCount || 300} Lexemes
            </span>
          </div>
          <p className="text-xs sm:text-base text-muted-label mt-1">
            Active recall, confidence self-assessment & targeted mistake drill.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => startRandomQuiz(filteredGroups[0])}
            className="imlaa-btn-secondary text-xs sm:text-sm py-2 px-3 sm:px-4 flex items-center space-x-2 min-h-11"
          >
            <HiSparkles className="w-4 h-4 text-plum shrink-0" />
            <span>Random Quiz</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. CORPUS SETS VIEW (Home Selection)                 */}
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
                        {group.mistakesCount} Needs Review
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
                      <span>Corpus Mastery</span>
                      <span>{group.percent}%</span>
                    </div>
                    <div className="w-full bg-plum/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-plum transition-all duration-500"
                        style={{ width: `${group.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-plum/10 gap-2">
                    {group.hasMistakes ? (
                      <button
                        type="button"
                        onClick={() => handleStartDrill(group, true)}
                        className="imlaa-btn-secondary text-xs py-2 px-3 text-rose-700 font-bold border-rose-300"
                      >
                        Mistakes ({group.mistakesCount})
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
                      Study Flashcards
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. ACTIVE FLASHCARD DRILL VIEW                       */}
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
                Loading flashcards...
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
                  Card <span className="text-plum">{currentIndex + 1}</span> of {activeWords.length}
                </span>

                {/* Native Language Selector (Item 3) */}
                <div className="flex items-center space-x-1.5 text-xs text-muted-label">
                  <HiLanguage className="w-4 h-4 text-plum" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="imlaa-input py-1 px-2 text-xs font-semibold rounded-lg"
                  >
                    {Object.entries(LANGUAGE_TRANSLATIONS).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3D Animated Flip Card */}
              <div
                key={currentIndex}
                className={`imlaa-flip-card-container ${
                  slideDirection === "next" ? "animate-card-next" : "animate-card-prev"
                }`}
              >
                <div
                  className={`imlaa-flip-card-inner ${
                    isFlipped ? "is-flipped" : ""
                  }`}
                >
                  {/* FRONT FACE: Word prompt */}
                  <div
                    onClick={() => setIsFlipped(true)}
                    className="imlaa-flip-face imlaa-card p-10 text-center bg-white border border-plum/20 shadow-md flex flex-col justify-between cursor-pointer min-h-95"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-muted-label uppercase tracking-wider">
                      <span>Front • Word Recall</span>
                      <span className="text-plum font-semibold">Press Tab or Space to Flip</span>
                    </div>

                    <div className="flex flex-col items-center space-y-4 my-auto">
                      <h2 className="text-4xl sm:text-5xl font-black text-body-dark tracking-tight">
                        {currentWord.word}
                      </h2>
                      <span className="text-lg text-plum font-semibold italic">
                        {currentWord.pos || "Lexeme"}
                      </span>

                      {/* Audio Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakCurrentWord();
                        }}
                        className="mt-3 w-12 h-12 rounded-xl bg-plum/10 hover:bg-plum hover:text-white text-plum flex items-center justify-center transition cursor-pointer"
                        title="Listen to pronunciation"
                      >
                        <HiSpeakerWave className={`w-6 h-6 ${isSpeaking ? "animate-pulse" : ""}`} />
                      </button>
                    </div>

                    <div className="pt-4 border-t border-plum/10">
                      <span className="text-sm font-semibold text-plum hover:underline">
                        Click card or press Tab to reveal meaning & details →
                      </span>
                    </div>
                  </div>

                  {/* BACK FACE: Meaning, Synonyms & Assessment (Item 2) */}
                  <div className="imlaa-flip-face imlaa-flip-face-back imlaa-card p-6 sm:p-8 text-left bg-white border border-plum/20 shadow-md flex flex-col justify-between min-h-95">
                    <div className="flex flex-col space-y-4 w-full">
                      {/* Top Header */}
                      <div className="flex items-center justify-between border-b border-plum/15 pb-3">
                        <div>
                          <h3 className="text-3xl font-black text-body-dark">
                            {currentWord.word}
                          </h3>
                          <span className="text-sm text-plum font-semibold italic">
                            {currentWord.pos}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => speakCurrentWord()}
                          className="w-10 h-10 rounded-xl bg-plum/10 hover:bg-plum hover:text-white text-plum flex items-center justify-center transition cursor-pointer"
                        >
                          <HiSpeakerWave className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Meaning */}
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-label font-bold mb-1">
                          Meaning ({LANGUAGE_TRANSLATIONS[selectedLanguage]})
                        </div>
                        <div className="text-xl font-bold text-body-dark">
                          {currentWord.banglaMeaning}
                        </div>
                      </div>

                      {/* Synonyms */}
                      {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-label font-bold mb-1">
                            Synonyms
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {currentWord.synonyms.map((syn, idx) => (
                              <span
                                key={idx}
                                className="imlaa-badge text-xs py-0.5 px-2 font-medium"
                              >
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Example Sentence */}
                      {currentWord.exampleUsage && (
                        <div className="p-3 rounded-xl bg-plum/5 border border-plum/20">
                          <p className="text-sm text-body-dark italic">
                            "{currentWord.exampleUsage}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* POST-FLIP ASSESSMENT BUTTONS (Item 2 Requirement) */}
                    <div className="pt-4 border-t border-plum/15 mt-4">
                      <div className="text-xs font-bold text-muted-label uppercase tracking-wider text-center mb-2.5">
                        How well did you know this word?
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        {/* 1. Didn't Know */}
                        <button
                          type="button"
                          disabled={hasAnsweredCurrent}
                          onClick={() => handleRateCard("unknown")}
                          className="p-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm flex flex-col items-center space-y-1 transition active:scale-95 cursor-pointer"
                        >
                          <HiXCircle className="w-5 h-5" />
                          <span>Didn't Know</span>
                          <span className="text-[10px] text-rose-500 font-normal">[1]</span>
                        </button>

                        {/* 2. Forgot */}
                        <button
                          type="button"
                          disabled={hasAnsweredCurrent}
                          onClick={() => handleRateCard("forgot")}
                          className="p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm flex flex-col items-center space-y-1 transition active:scale-95 cursor-pointer"
                        >
                          <HiClock className="w-5 h-5" />
                          <span>Forgot</span>
                          <span className="text-[10px] text-amber-500 font-normal">[2]</span>
                        </button>

                        {/* 3. I Knew It */}
                        <button
                          type="button"
                          disabled={hasAnsweredCurrent}
                          onClick={() => handleRateCard("knew")}
                          className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm flex flex-col items-center space-y-1 transition active:scale-95 cursor-pointer"
                        >
                          <HiCheckCircle className="w-5 h-5" />
                          <span>I Knew It</span>
                          <span className="text-[10px] text-emerald-500 font-normal">[3]</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Nav Controls (Prev / Next) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    if (currentIndex > 0) {
                      setSlideDirection("prev");
                      setCurrentIndex((prev) => prev - 1);
                      setIsFlipped(false);
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
                  onClick={() => setIsFlipped((prev) => !prev)}
                  className="imlaa-btn-secondary py-2.5 sm:py-3 px-4 text-xs sm:text-sm w-full sm:w-auto min-h-11"
                >
                  {isFlipped ? "Flip to Word" : "Flip to Meaning"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!hasAnsweredCurrent && !isFlipped) {
                      setIsFlipped(true);
                      return;
                    }
                    if (currentIndex < activeWords.length - 1) {
                      setSlideDirection("next");
                      setCurrentIndex((prev) => prev + 1);
                      setIsFlipped(false);
                      setHasAnsweredCurrent(false);
                    } else {
                      setViewMode("finished");
                    }
                  }}
                  className="imlaa-btn-primary py-2.5 sm:py-3 px-4 sm:px-5 text-sm sm:text-base flex items-center justify-center space-x-2 w-full sm:w-auto min-h-11"
                >
                  <span>{currentIndex === activeWords.length - 1 ? "Finish Drill" : "Next Word"}</span>
                  <HiChevronRight className="w-5 h-5 shrink-0" />
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
              Flashcard Session Complete!
            </h2>
            <p className="text-base text-muted-label">
              Here is your active recall breakdown for {selectedGroup?.title}.
            </p>
          </div>

          {/* Stats Numbers Grid (Item 2: Knew, Unknown, Forgot) */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {/* Knew */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-3xl font-black text-emerald-700">
                {sessionKnew.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mt-1">
                Knew It
              </div>
            </div>

            {/* Unknown */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <div className="text-3xl font-black text-rose-700">
                {sessionUnknown.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-800 mt-1">
                Didn't Know
              </div>
            </div>

            {/* Forgot */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-3xl font-black text-amber-700">
                {sessionForgot.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mt-1">
                Forgot
              </div>
            </div>
          </div>

          {/* Action Options (Item 2: Practice Mistakes & Start Over) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-plum/15">
            {sessionUnknown.length + sessionForgot.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const mistakeWords = words.filter(
                    (w) =>
                      sessionUnknown.includes(w.word) ||
                      sessionForgot.includes(w.word)
                  );
                  setMistakesList(mistakeWords);
                  setMistakesOnly(true);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setHasAnsweredCurrent(false);
                  setSessionKnew([]);
                  setSessionUnknown([]);
                  setSessionForgot([]);
                  setViewMode("drill");
                }}
                className="imlaa-btn-primary w-full sm:w-auto py-3 px-6 text-base font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Practice Mistakes ({sessionUnknown.length + sessionForgot.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMistakesOnly(false);
                setCurrentIndex(0);
                setIsFlipped(false);
                setHasAnsweredCurrent(false);
                setSessionKnew([]);
                setSessionUnknown([]);
                setSessionForgot([]);
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
      {/* 5. RANDOM QUIZ VIEW (Item 5 Requirement)             */}
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
            <div className="imlaa-card p-8 bg-white border border-plum/20 shadow-md space-y-6">
              <div className="flex items-center justify-between text-sm text-muted-label font-semibold">
                <span>
                  Question {quizIndex + 1} of {quizQuestions.length}
                </span>
                <span>Score: {quizScore}</span>
              </div>

              <div className="text-center py-4 space-y-2 border-b border-plum/10">
                <h3 className="text-4xl font-black text-body-dark">
                  {quizQuestions[quizIndex].word}
                </h3>
                <span className="text-base text-plum font-semibold italic">
                  {quizQuestions[quizIndex].pos}
                </span>
              </div>

              {/* 4 Choices */}
              <div className="grid grid-cols-1 gap-3">
                {quizQuestions[quizIndex].options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuizAnswer(opt)}
                    className="p-4 rounded-xl border border-plum/20 hover:border-plum hover:bg-plum/5 text-left font-semibold text-body-dark transition cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Quiz Results */
            <div className="imlaa-card p-8 bg-white border border-plum/20 shadow-md text-center space-y-6">
              <h2 className="text-3xl font-black text-body-dark">Quiz Completed!</h2>
              <div className="text-5xl font-black text-plum">
                {quizScore} / {quizQuestions.length}
              </div>
              <p className="text-base text-muted-label">
                Accuracy: {Math.round((quizScore / (quizQuestions.length || 1)) * 100)}%
              </p>

              {quizUserAnswers.length > 0 && (
                <div className="max-h-48 overflow-y-auto text-left text-xs space-y-1.5 p-3 rounded-xl bg-plum/5 border border-plum/10">
                  <div className="font-bold text-plum mb-1 uppercase tracking-wider text-[11px]">
                    Answer Summary:
                  </div>
                  {quizUserAnswers.map((ans, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 border-b border-plum/10 last:border-0"
                    >
                      <span className="font-bold text-body-dark">
                        {ans.question}: <span className="font-normal text-muted-label">{ans.chosen}</span>
                      </span>
                      <span
                        className={`font-bold ${
                          ans.isCorrect ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {ans.isCorrect ? "✓ Correct" : `✗ Answer: ${ans.correct}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-4 border-t border-plum/10">
                <button
                  type="button"
                  onClick={() => launchQuizSession()}
                  className="imlaa-btn-primary py-3 px-6 text-base"
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
                Random Vocabulary Quiz
              </h3>

              {/* Quantity Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-label block mb-2">
                  Number of Questions
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
                      {qty} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Selection */}
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

              {/* Actions */}
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
