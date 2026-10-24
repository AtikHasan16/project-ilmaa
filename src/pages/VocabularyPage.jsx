import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../services/apiClient";
import {
  HiSpeakerWave,
  HiArrowPath,
  HiChevronLeft,
  HiChevronRight,
  HiCheckCircle,
  HiExclamationCircle,
} from "react-icons/hi2";

const TOPICS = [
  "Part 1: Basics",
  "Part 2: Intermediate",
  "Part 3: Advanced",
  "Uploaded",
];

export default function VocabularyPage() {
  const [activeTopic, setActiveTopic] = useState("Part 1: Basics");
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spellingInput, setSpellingInput] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null); // 'correct' | 'incorrect' | null
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [incorrectList, setIncorrectList] = useState([]);
  const [showPracticeIncorrectOnly, setShowPracticeIncorrectOnly] = useState(false);

  const flipTimerRef = useRef(null);

  // Fetch words for the active topic
  const loadWords = useCallback(async () => {
    setLoading(true);
    setStatusFeedback(null);
    setSpellingInput("");
    setIsFlipped(false);
    try {
      const isUploaded = activeTopic === "Uploaded";
      const params = isUploaded
        ? { uploadedOnly: "true" }
        : { topic: activeTopic };

      const res = await apiClient.get("/vocabulary", { params });
      if (res.data?.success) {
        const fetched = res.data.data || [];
        setWords(fetched);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error("Failed to load vocabulary words:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTopic]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const activeWords = showPracticeIncorrectOnly ? incorrectList : words;
  const currentWord = activeWords[currentIndex] || null;

  // Speak target word using Web Speech API
  const speakWord = useCallback(
    (targetWord) => {
      const wordToSpeak = targetWord || currentWord?.word;
      if (!wordToSpeak || !("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(wordToSpeak);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [currentWord],
  );

  // Auto-pronounce on word change
  useEffect(() => {
    if (currentWord && !isFlipped) {
      speakWord(currentWord.word);
    }
  }, [currentIndex, currentWord, isFlipped, speakWord]);

  // Handle spelling submission
  const handleSpellingSubmit = (e) => {
    e.preventDefault();
    if (!currentWord || evaluating || !spellingInput.trim()) return;

    setEvaluating(true);
    const cleanInput = spellingInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();

    if (cleanInput === cleanTarget) {
      setStatusFeedback("correct");
      // Auto flip after momentary validation
      flipTimerRef.current = setTimeout(() => {
        setIsFlipped(true);
        setEvaluating(false);
      }, 500);
    } else {
      setStatusFeedback("incorrect");
      if (!incorrectList.some((w) => w.word === currentWord.word)) {
        setIncorrectList((prev) => [...prev, currentWord]);
      }
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < activeWords.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setSpellingInput("");
      setStatusFeedback(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setSpellingInput("");
      setStatusFeedback(null);
    }
  };

  const handleResetTopic = () => {
    setShowPracticeIncorrectOnly(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSpellingInput("");
    setStatusFeedback(null);
  };

  return (
    <div className="w-full flex flex-col space-y-8">
      {/* Topic Switcher Bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-plum/20 pb-4">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => {
              setActiveTopic(topic);
              setShowPracticeIncorrectOnly(false);
            }}
            className={`imlaa-tab-btn text-base ${
              activeTopic === topic && !showPracticeIncorrectOnly ? "active" : ""
            }`}
          >
            {topic}
          </button>
        ))}

        {incorrectList.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setShowPracticeIncorrectOnly(!showPracticeIncorrectOnly);
              setCurrentIndex(0);
              setIsFlipped(false);
              setSpellingInput("");
              setStatusFeedback(null);
            }}
            className={`imlaa-badge text-base cursor-pointer ml-auto transition-all ${
              showPracticeIncorrectOnly
                ? "bg-plum text-white border-plum"
                : "hover:bg-plum/20"
            }`}
          >
            Practice Incorrect ({incorrectList.length})
          </button>
        )}
      </div>

      {/* Main Flashcard Container */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        {loading ? (
          <div className="imlaa-card w-full p-12 text-center animate-pulse">
            <div className="text-xl text-plum font-semibold">
              Loading vocabulary...
            </div>
          </div>
        ) : activeWords.length === 0 ? (
          <div className="imlaa-card w-full p-12 text-center space-y-4">
            <div className="text-2xl font-bold text-body-dark">
              No vocabulary entries found
            </div>
            <p className="text-base text-muted-label">
              {activeTopic === "Uploaded"
                ? "You haven't uploaded any custom words yet. Head to Upload Study to add words."
                : "No entries available in this section."}
            </p>
            <button
              type="button"
              onClick={handleResetTopic}
              className="imlaa-btn-secondary text-base"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col space-y-6">
            {/* Progress / Step indicator */}
            <div className="flex items-center justify-between text-base text-muted-label px-2">
              <span className="font-medium text-body-dark">
                Word {currentIndex + 1} of {activeWords.length}
              </span>
              <span className="font-mono">{activeTopic}</span>
            </div>

            {/* Interactive Flashcard */}
            <div className="imlaa-card w-full p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-95 relative transition-all duration-300">
              {!isFlipped ? (
                /* ==================================================== */
                /* Front Side: Auditory Dictation & Spelling Input     */
                /* ==================================================== */
                <div className="w-full flex flex-col items-center space-y-8 my-auto">
                  {/* Pronunciation Trigger */}
                  <div className="flex flex-col items-center space-y-3">
                    <button
                      type="button"
                      onClick={() => speakWord()}
                      title="Play Audio Pronunciation"
                      className="w-20 h-20 rounded-2xl bg-plum hover:bg-plum-hover text-white flex items-center justify-center transition shadow-md cursor-pointer active:scale-95"
                    >
                      <HiSpeakerWave
                        className={`w-10 h-10 ${isSpeaking ? "animate-pulse" : ""}`}
                      />
                    </button>
                    <span className="text-base text-muted-label font-medium">
                      Click to listen to pronunciation
                    </span>
                  </div>

                  {/* Spelling Form */}
                  <form
                    onSubmit={handleSpellingSubmit}
                    className="w-full max-w-md flex flex-col space-y-4"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        autoFocus
                        value={spellingInput}
                        onChange={(e) => {
                          setSpellingInput(e.target.value);
                          if (statusFeedback) setStatusFeedback(null);
                        }}
                        placeholder="Type what you hear..."
                        className={`imlaa-input text-xl sm:text-2xl text-center py-4 px-6 tracking-wide ${
                          statusFeedback === "correct"
                            ? "border-emerald-600 focus:border-emerald-600"
                            : statusFeedback === "incorrect"
                              ? "border-rose-600 focus:border-rose-600"
                              : ""
                        }`}
                      />
                    </div>

                    {/* Feedback Alert */}
                    {statusFeedback === "incorrect" && (
                      <div className="flex items-center justify-center space-x-2 text-base text-rose-700 font-medium">
                        <HiExclamationCircle className="w-5 h-5" />
                        <span>Incorrect spelling. Try listening again or reveal study card.</span>
                      </div>
                    )}
                    {statusFeedback === "correct" && (
                      <div className="flex items-center justify-center space-x-2 text-base text-emerald-700 font-semibold">
                        <HiCheckCircle className="w-5 h-5" />
                        <span>Flawless! Opening study card...</span>
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
                        className="imlaa-btn-secondary py-3.5 text-base"
                      >
                        Flip Card
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* ==================================================== */
                /* Back Side: Complete Pedagogical Study Profile       */
                /* ==================================================== */
                <div className="w-full flex flex-col space-y-6 text-left my-auto">
                  {/* Row 1: Target Word & POS */}
                  <div className="flex items-center justify-between border-b border-plum/15 pb-4">
                    <div>
                      <h3 className="text-4xl sm:text-5xl font-black text-body-dark tracking-tight">
                        {currentWord.word}
                      </h3>
                      <span className="text-lg text-plum font-semibold italic">
                        {currentWord.pos}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakWord()}
                      title="Replay Audio"
                      className="w-12 h-12 rounded-xl bg-plum/10 hover:bg-plum hover:text-white text-plum flex items-center justify-center transition cursor-pointer"
                    >
                      <HiSpeakerWave className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Row 2: Bengali Meaning */}
                  <div>
                    <div className="text-base uppercase tracking-wider text-muted-label font-bold mb-1">
                      Bengali Meaning
                    </div>
                    <div className="text-2xl font-semibold text-body-dark">
                      {currentWord.banglaMeaning}
                    </div>
                  </div>

                  {/* Row 3: Synonyms */}
                  {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                    <div>
                      <div className="text-base uppercase tracking-wider text-muted-label font-bold mb-2">
                        Synonyms
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentWord.synonyms.map((syn, idx) => (
                          <span
                            key={idx}
                            className="imlaa-badge text-base py-1 px-3"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Row 4: Example Sentence */}
                  {currentWord.exampleUsage && (
                    <div className="p-4 rounded-xl bg-plum/5 border border-plum/20">
                      <div className="text-base uppercase tracking-wider text-muted-label font-bold mb-1">
                        Usage Example
                      </div>
                      <p className="text-lg text-body-dark italic leading-relaxed">
                        "{currentWord.exampleUsage}"
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsFlipped(false)}
                      className="imlaa-btn-secondary text-base"
                    >
                      Flip Back to Practice
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation Controls */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="imlaa-btn-secondary py-3 px-5 text-base space-x-2"
              >
                <HiChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleResetTopic}
                title="Restart this section"
                className="imlaa-btn-secondary py-3 px-4 text-base space-x-1.5"
              >
                <HiArrowPath className="w-5 h-5" />
                <span>Restart</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === activeWords.length - 1}
                className="imlaa-btn-primary py-3 px-5 text-base space-x-2"
              >
                <span>Next Word</span>
                <HiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
