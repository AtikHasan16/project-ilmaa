import { useState, useEffect, useCallback } from "react";
import apiClient from "../services/apiClient";
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
const VOCAB_GROUPS = [
  {
    id: "oxford-3000",
    part: "Part 1",
    title: "Oxford 3000 — Core Verbs",
    description: "Phoneme groups, irregular stresses & silent consonants.",
    status: "COMPLETED",
    progress: "47 / 50 Mastered",
    accuracy: "94% Accuracy",
    percent: 94,
    wordsCount: 50,
    hasIncorrect: true,
    incorrectCount: 3,
  },
  {
    id: "academic-sublist-a",
    part: "Part 1",
    title: "Academic Word List: Sublist A",
    description: "High-frequency academic stems and Latin morphemes.",
    status: "MASTERED",
    progress: "50 / 50 Mastered",
    accuracy: "100% Accuracy",
    percent: 100,
    wordsCount: 50,
    hasIncorrect: false,
    incorrectCount: 0,
  },
  {
    id: "gre-high-freq",
    part: "Part 1",
    title: "GRE High-Frequency — Group 1",
    description: "Complex polysyllabic lexical sets with obscure accents.",
    status: "UNSTARTED",
    progress: "0 / 45 Words",
    accuracy: null,
    percent: 0,
    wordsCount: 45,
    hasIncorrect: false,
    incorrectCount: 0,
  },
  {
    id: "medical-latin",
    part: "Part 1",
    title: "Medical Latin Roots — Part 1",
    description: "Anatomical stems, clinical affixes, and diphthongs.",
    status: "UNSTARTED",
    progress: "0 / 40 Words",
    accuracy: null,
    percent: 0,
    wordsCount: 40,
    hasIncorrect: false,
    incorrectCount: 0,
  },
  {
    id: "phonetic-oddities",
    part: "Part 1",
    title: "Phonetic Oddities & Silent Letters",
    description: "Silent k, b, p, and deceptive English orthographic norms.",
    status: "UNSTARTED",
    progress: "0 / 55 Words",
    accuracy: null,
    percent: 0,
    wordsCount: 55,
    hasIncorrect: false,
    incorrectCount: 0,
  },
  // Part 2
  {
    id: "ielts-band-8",
    part: "Part 2",
    title: "IELTS Band 8+ Academic Collocations",
    description: "High-level nuance collocations tested in academic essays.",
    status: "UNSTARTED",
    progress: "0 / 40 Words",
    accuracy: null,
    percent: 0,
    wordsCount: 40,
    hasIncorrect: false,
    incorrectCount: 0,
  },
  {
    id: "idiomatic-verbs",
    part: "Part 2",
    title: "Advanced Phrasal & Idiomatic Verbs",
    description: "Multi-word verbs with unpredictable particle shifts.",
    status: "UNSTARTED",
    progress: "0 / 35 Words",
    accuracy: null,
    percent: 0,
    wordsCount: 35,
    hasIncorrect: false,
    incorrectCount: 0,
  },
  // Part 3
  {
    id: "archaic-formal",
    part: "Part 3",
    title: "Archaic & Formal Registers",
    description: "Juridical and diplomatic vocabulary for high-end discourse.",
    status: "UNSTARTED",
    progress: "0 / 30 Words",
    accuracy: null,
    percent: 0,
    wordsCount: 30,
    hasIncorrect: false,
    incorrectCount: 0,
  },
  // Part 4
  {
    id: "stem-affix",
    part: "Part 4",
    title: "Morphological Stems & Affixes",
    description: "Etymological root breakdowns for systematic decipherment.",
    status: "UNSTARTED",
    progress: "0 / 45 Words",
    accuracy: null,
    percent: 0,
    wordsCount: 45,
    hasIncorrect: false,
    incorrectCount: 0,
  },
  // Uploaded
  {
    id: "custom-uploaded",
    part: "Uploaded",
    title: "Custom Uploaded Corpus",
    description: "Personal words uploaded through the Upload to Study module.",
    status: "ACTIVE",
    progress: "Dynamic List",
    accuracy: null,
    percent: 50,
    wordsCount: "Dynamic",
    hasIncorrect: false,
    incorrectCount: 0,
  },
];

const PARTS = ["Part 1", "Part 2", "Part 3", "Part 4", "Uploaded"];

export default function VocabularyPage() {
  const [activePart, setActivePart] = useState("Part 1");
  const [selectedGroup, setSelectedGroup] = useState(null); // When null => show Corpus Sets home page
  const [viewMode, setViewMode] = useState("sets"); // 'sets' | 'flashcard'

  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spellingInput, setSpellingInput] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [incorrectList, setIncorrectList] = useState([]);
  const [showPracticeIncorrectOnly, setShowPracticeIncorrectOnly] =
    useState(false);

  // Load words when entering a flashcard group
  const loadWordsForGroup = useCallback(async (group) => {
    setLoading(true);
    setStatusFeedback(null);
    setSpellingInput("");
    setIsFlipped(false);
    setCurrentIndex(0);
    try {
      const isUploaded = group.part === "Uploaded";
      const params = isUploaded
        ? { uploadedOnly: "true" }
        : { topic: group.part === "Part 1" ? "Part 1: Basics" : group.part };

      const res = await apiClient.get("/vocabulary", { params });
      if (res.data?.success && res.data.data && res.data.data.length > 0) {
        setWords(res.data.data);
      } else {
        // Fallback default corpus if topic is fresh
        setWords([
          {
            word: "Fastidious",
            pos: "Adjective",
            banglaMeaning: "খুঁতখুঁতে / সহজে সন্তুষ্ট হয় না এমন",
            synonyms: ["Meticulous", "Punctilious", "Scrupulous"],
            exampleUsage:
              "He was fastidious about his appearance, always immaculate in pressed linen.",
          },
          {
            word: "Ubiquitous",
            pos: "Adjective",
            banglaMeaning: "সর্বব্যাপী / যা সর্বত্র বিদ্যমান",
            synonyms: ["Omnipresent", "Pervasive", "Universal"],
            exampleUsage:
              "Smartphones have become ubiquitous in modern academic life.",
          },
          {
            word: "Ephemeral",
            pos: "Adjective",
            banglaMeaning: "ক্ষণস্থায়ী",
            synonyms: ["Transient", "Fleeting", "Short-lived"],
            exampleUsage: "Fashions are ephemeral, but true style endures.",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load vocabulary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStartGroup = (group, incorrectOnly = false) => {
    setSelectedGroup(group);
    setViewMode("flashcard");
    setShowPracticeIncorrectOnly(incorrectOnly);
    loadWordsForGroup(group);
  };

  const handleReturnToSets = () => {
    setSelectedGroup(null);
    setViewMode("sets");
    setIsFlipped(false);
    setSpellingInput("");
    setStatusFeedback(null);
  };

  const activeWords = showPracticeIncorrectOnly ? incorrectList : words;
  const currentWord = activeWords[currentIndex] || null;

  // Web Speech audio dictation
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

  useEffect(() => {
    if (viewMode === "flashcard" && currentWord && !isFlipped) {
      speakWord(currentWord.word);
    }
  }, [viewMode, currentIndex, currentWord, isFlipped, speakWord]);

  // Handle spelling check
  const handleSpellingSubmit = (e) => {
    e.preventDefault();
    if (!currentWord || evaluating || !spellingInput.trim()) return;

    setEvaluating(true);
    const cleanInput = spellingInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();

    if (cleanInput === cleanTarget) {
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

  const filteredGroups = VOCAB_GROUPS.filter((g) => g.part === activePart);

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
                    <p className="text-base text-muted-label leading-relaxed mb-6">
                      {group.description}
                    </p>
                  </div>

                  <div>
                    {/* Progress Bar if started */}
                    {(isCompleted || isMastered) && (
                      <div className="w-full bg-plum/10 rounded-full h-1.5 mb-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isMastered ? "bg-emerald-600" : "bg-plum"
                          }`}
                          style={{ width: `${group.percent}%` }}
                        />
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-plum/10">
                      {isCompleted ? (
                        <>
                          <span className="text-base font-bold text-body-dark">
                            {group.accuracy}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleStartGroup(group)}
                              className="imlaa-btn-secondary py-1.5 px-3 text-base text-body-dark"
                            >
                              Reset
                            </button>
                            {group.hasIncorrect && (
                              <button
                                type="button"
                                onClick={() => handleStartGroup(group, true)}
                                className="imlaa-btn-primary py-1.5 px-3 text-base"
                              >
                                Practice Incorrect ({group.incorrectCount})
                              </button>
                            )}
                          </div>
                        </>
                      ) : isMastered ? (
                        <>
                          <span className="text-base font-bold text-body-dark">
                            {group.accuracy}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleStartGroup(group)}
                              className="imlaa-btn-secondary py-1.5 px-3 text-base text-body-dark"
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              disabled
                              className="imlaa-btn-secondary py-1.5 px-3 text-base opacity-40 cursor-not-allowed"
                            >
                              Practice Incorrect (0)
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-base text-muted-label font-medium">
                            {group.wordsCount} Lexemes
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartGroup(group)}
                            className="imlaa-btn-primary py-2 px-5 text-base"
                          >
                            Start Topic
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
              {/* Step indicator */}
              <div className="flex items-center justify-between text-base text-muted-label px-2">
                <span className="font-semibold text-body-dark">
                  Word {currentIndex + 1} of {activeWords.length}
                </span>
                {showPracticeIncorrectOnly && (
                  <span className="text-rose-600 font-bold">
                    Practice Incorrect Only
                  </span>
                )}
              </div>

              {/* 3D Animated Flip Card */}
              <div className="imlaa-flip-card-container">
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
                            className="imlaa-btn-secondary py-3.5 text-base"
                          >
                            Flip Card
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* BACK FACE: Structured 4-Row Study Card */}
                  <div className="imlaa-flip-face imlaa-flip-face-back imlaa-card p-8 sm:p-12 text-left bg-white border border-plum/20 shadow-md">
                    <div className="flex flex-col space-y-6 my-auto">
                      {/* Row 1: Word + POS + Replay */}
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
                          title="Replay pronunciation"
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
                      {currentWord.synonyms &&
                        currentWord.synonyms.length > 0 && (
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
                  </div>
                </div>
              </div>

              {/* Bottom Nav Controls */}
              <div className="flex items-center justify-between gap-4 pt-2">
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
                  className="imlaa-btn-primary py-3 px-5 text-base space-x-2"
                >
                  <span>Next Word</span>
                  <HiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
