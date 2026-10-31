import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  HiSpeakerWave,
  HiPencilSquare,
  HiTrophy,
  HiArrowRight,
  HiArrowLeft,
  HiCheck,
} from "react-icons/hi2";
import { useModalEffects } from "../hooks/useModalEffects.js";
import { fireConfetti } from "../utils/confetti.js";

const SLIDES = [
  {
    step: 1,
    title: "1. Listen to Phonemes",
    tagline: "Phonetic Immersion",
    description:
      "Absorb high-fidelity academic pronunciation powered by neural speech synthesis. Tune your ear to British and North American academic phonology.",
    icon: HiSpeakerWave,
    accent: "plum",
  },
  {
    step: 2,
    title: "2. Spell with Zero Visual Bias",
    tagline: "Orthographic Retrieval",
    description:
      "Practice spelling without visual crutches. Reinforce true orthographic recall to eliminate common silent-letter and double-consonant errors.",
    icon: HiPencilSquare,
    accent: "plum",
  },
  {
    step: 3,
    title: "3. Master the Lexicon",
    tagline: "Verified Competence",
    description:
      "Track spaced-repetition retention, conquer corpus sets, unlock milestone badges, and export verified study certificates of achievement.",
    icon: HiTrophy,
    accent: "amber",
  },
];

export default function OnboardingModal({ isOpen, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useModalEffects(isOpen, onClose, false, true);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        setCurrentSlide((prev) => Math.min(SLIDES.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const isLast = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem("imlaa_onboarding_completed", "true");
      fireConfetti({ particleCount: 70, spread: 60, origin: { x: 0.5, y: 0.5 } });
      onClose();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    localStorage.setItem("imlaa_onboarding_completed", "true");
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-slide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="imlaa-card w-full max-w-lg bg-white border border-plum/20 shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-scale-up">
        {/* Top bar */}
        <div className="p-4 border-b border-plum/10 flex items-center justify-between bg-plum/5">
          <span className="text-xs font-bold uppercase tracking-wider text-plum">
            Welcome to Imlaa &bull; Step {currentSlide + 1} of {SLIDES.length}
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-muted-label hover:text-plum font-semibold px-2 py-1 cursor-pointer transition min-h-11 flex items-center"
          >
            Skip Intro
          </button>
        </div>

        {/* Slide Body */}
        <div className="p-8 text-center flex flex-col items-center space-y-5">
          <div className="w-18 h-18 rounded-2xl bg-plum/10 text-plum flex items-center justify-center shadow-xs">
            <Icon className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-plum/10 text-plum uppercase tracking-wider">
              {slide.tagline}
            </span>
            <h2
              id="onboarding-slide-title"
              className="text-xl sm:text-2xl font-black text-body-dark"
            >
              {slide.title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-label max-w-sm mx-auto leading-relaxed">
              {slide.description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-2 pt-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentSlide
                    ? "w-8 bg-plum"
                    : "w-2 bg-plum/20 hover:bg-plum/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-plum/10 bg-plum/5 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`imlaa-btn-secondary px-3 py-2 text-xs font-semibold flex items-center space-x-1 min-h-11 ${
              currentSlide === 0 ? "opacity-0 pointer-events-none" : ""
            }`}
          >
            <HiArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="imlaa-btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center space-x-1.5 min-h-11 shadow-sm"
          >
            <span>{isLast ? "Begin Learning" : "Next"}</span>
            {isLast ? (
              <HiCheck className="w-4 h-4" />
            ) : (
              <HiArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
