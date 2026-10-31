import { useState } from "react";
import { createPortal } from "react-dom";
import { BADGE_CATALOG } from "../services/badgeService.js";
import { fireConfetti } from "../utils/confetti.js";
import { useModalEffects } from "../hooks/useModalEffects.js";
import {
  HiTrophy,
  HiSparkles,
  HiAcademicCap,
  HiBookOpen,
  HiClock,
  HiCheckCircle,
  HiLockClosed,
  HiFire,
  HiXMark,
  HiHeart,
  HiCloudArrowUp,
  HiPencilSquare,
} from "react-icons/hi2";

const ICON_MAP = {
  sparkles: HiSparkles,
  book: HiBookOpen,
  academic: HiAcademicCap,
  trophy: HiTrophy,
  fire: HiFire,
  clock: HiClock,
  check: HiCheckCircle,
  pencil: HiPencilSquare,
  heart: HiHeart,
  cloud: HiCloudArrowUp,
};

export default function BadgesModal({ isOpen, onClose, userBadges = [] }) {
  const [filter, setFilter] = useState("all"); // 'all' | 'unlocked' | 'locked'

  useModalEffects(isOpen, onClose, false, true);

  if (!isOpen) return null;

  const unlockedMap = new Map();
  (userBadges || []).forEach((b) => {
    unlockedMap.set(b.badgeKey, b.unlockedAt);
  });

  const totalBadges = BADGE_CATALOG.length;
  const unlockedCount = unlockedMap.size;
  const completionPct = Math.round((unlockedCount / totalBadges) * 100);

  const filteredBadges = BADGE_CATALOG.filter((b) => {
    const isUnlocked = unlockedMap.has(b.key);
    if (filter === "unlocked") return isUnlocked;
    if (filter === "locked") return !isUnlocked;
    return true;
  });

  const handleCelebrate = () => {
    fireConfetti({ particleCount: 100, spread: 80, origin: { x: 0.5, y: 0.5 } });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="badges-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="imlaa-card w-full max-w-2xl bg-white border border-plum/20 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden rounded-2xl animate-scale-up">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-plum/15 flex items-center justify-between bg-plum/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-plum text-white flex items-center justify-center shadow-xs">
              <HiTrophy className="w-6 h-6" />
            </div>
            <div>
              <h2 id="badges-modal-title" className="text-lg sm:text-xl font-bold text-body-dark">
                Badges & Milestones
              </h2>
              <p className="text-xs text-muted-label">
                {unlockedCount} of {totalBadges} milestones unlocked ({completionPct}%)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unlockedCount > 0 && (
              <button
                type="button"
                onClick={handleCelebrate}
                title="Celebrate Milestones"
                className="imlaa-btn-secondary px-2.5 py-1.5 text-xs font-semibold flex items-center space-x-1"
              >
                <HiSparkles className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Celebrate</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Badges Modal"
              className="w-9 h-9 rounded-lg text-muted-label hover:text-body-dark hover:bg-plum/10 flex items-center justify-center cursor-pointer transition min-h-11 min-w-11"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2.5 bg-plum/5 border-b border-plum/10">
          <div className="flex items-center justify-between text-xs text-muted-label mb-1">
            <span>Overall Milestone Progress</span>
            <span className="font-bold text-plum">{completionPct}% Complete</span>
          </div>
          <div className="w-full bg-plum/15 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-plum transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-plum/10 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-11 ${
              filter === "all"
                ? "bg-plum text-white"
                : "text-muted-label hover:bg-plum/10"
            }`}
          >
            All Badges ({totalBadges})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unlocked")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-11 ${
              filter === "unlocked"
                ? "bg-plum text-white"
                : "text-muted-label hover:bg-plum/10"
            }`}
          >
            Unlocked ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("locked")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-11 ${
              filter === "locked"
                ? "bg-plum text-white"
                : "text-muted-label hover:bg-plum/10"
            }`}
          >
            Locked ({totalBadges - unlockedCount})
          </button>
        </div>

        {/* Badges Grid */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredBadges.map((badge) => {
              const isUnlocked = unlockedMap.has(badge.key);
              const unlockedAt = unlockedMap.get(badge.key);
              const Icon = ICON_MAP[badge.icon] || HiTrophy;

              return (
                <div
                  key={badge.key}
                  className={`p-4 rounded-xl border transition-all duration-200 flex items-start space-x-3.5 ${
                    isUnlocked
                      ? "bg-white border-plum/30 shadow-xs hover:border-plum"
                      : "bg-slate-50 border-slate-200 opacity-60 grayscale hover:grayscale-0 hover:opacity-80"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                      isUnlocked
                        ? "bg-gradient-to-br from-plum to-plum-hover text-white shadow-xs"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isUnlocked ? (
                      <Icon className="w-6 h-6" />
                    ) : (
                      <HiLockClosed className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-label">
                        {badge.category}
                      </span>
                      {isUnlocked ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Unlocked
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                          Locked
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-body-dark truncate">
                      {badge.title}
                    </h3>
                    <p className="text-xs text-muted-label leading-tight">
                      {badge.description}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-muted-label">
                      <span>Req: {badge.requirement}</span>
                      {isUnlocked && unlockedAt && (
                        <span className="text-emerald-700 font-semibold font-mono">
                          {new Date(unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-plum/15 bg-plum/5 flex items-center justify-between">
          <span className="text-xs text-muted-label">
            Complete study drills to unlock more achievements
          </span>
          <button
            type="button"
            onClick={onClose}
            className="imlaa-btn-primary py-2 px-4 text-xs font-bold min-h-11"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
