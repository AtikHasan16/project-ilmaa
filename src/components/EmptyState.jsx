import { HiSparkles, HiMagnifyingGlass } from "react-icons/hi2";

/**
 * Editorial Empty State Component
 * Provides clean illustration, encouraging headline, copy, and optional action trigger.
 */
export default function EmptyState({
  icon: IconComponent = HiSparkles,
  title = "You're All Caught Up!",
  description = "You've mastered all active curriculum items in this section. Come back tomorrow or launch a new topic!",
  actionLabel,
  onAction,
}) {
  return (
    <div className="w-full p-8 sm:p-12 rounded-2xl border border-plum/15 bg-plum/5 text-center flex flex-col items-center justify-center space-y-4 my-4 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-white border border-plum/20 text-plum shadow-xs flex items-center justify-center">
        <IconComponent className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-bold text-body-dark">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-label leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="imlaa-btn-primary px-5 py-2.5 text-xs sm:text-sm font-semibold min-h-11"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SearchEmptyState({ searchTerm = "", onReset }) {
  return (
    <EmptyState
      icon={HiMagnifyingGlass}
      title="No Matching Corpus Sets Found"
      description={`We couldn't find any topics matching "${searchTerm}". Check for typos or clear your search filter.`}
      actionLabel="Clear Filter"
      onAction={onReset}
    />
  );
}
