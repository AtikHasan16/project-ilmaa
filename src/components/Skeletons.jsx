/**
 * Shimmering skeleton screens shaped like cards, stat counters, and lists.
 * Replaces raw spinners with smooth placeholders.
 */

export function SkeletonStat() {
  return (
    <div className="imlaa-card p-5 sm:p-6 border border-plum/10 bg-white space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-24 bg-plum/10 rounded" />
        <div className="w-9 h-9 rounded-xl bg-plum/10" />
      </div>
      <div className="space-y-2">
        <div className="h-9 w-28 bg-plum/15 rounded" />
        <div className="h-3 w-40 bg-slate-100 rounded" />
      </div>
      <div className="pt-2 border-t border-plum/10 flex justify-between">
        <div className="h-3 w-20 bg-slate-100 rounded" />
        <div className="h-3 w-16 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="imlaa-card p-6 border border-plum/10 bg-white space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-plum/10" />
        <div className="h-4 w-16 bg-plum/10 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-slate-200 rounded" />
      <div className="space-y-2">
        <div className="h-3.5 w-full bg-slate-100 rounded" />
        <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
      </div>
      <div className="pt-3 border-t border-plum/10 flex items-center justify-between">
        <div className="h-4 w-20 bg-slate-100 rounded" />
        <div className="h-8 w-24 bg-plum/15 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonCorpusGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-xl border border-plum/15 bg-plum/5 flex flex-col justify-between space-y-4 min-h-[180px]"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-plum/15 rounded" />
              <div className="h-4 w-16 bg-plum/15 rounded-md" />
            </div>
            <div className="h-5 w-3/4 bg-plum/20 rounded" />
            <div className="h-4 w-32 bg-plum/10 rounded" />
          </div>
          <div className="space-y-2 pt-2 border-t border-plum/10">
            <div className="h-2 w-full bg-plum/15 rounded-full" />
            <div className="flex justify-between items-center pt-1">
              <div className="h-3 w-16 bg-plum/10 rounded" />
              <div className="h-7 w-20 bg-plum/20 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
