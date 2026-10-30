import { createPortal } from "react-dom";

const TIMER_OPTIONS = [
  { label: "Untimed", value: 0 },
  { label: "1 Min", value: 1 },
  { label: "2 Min", value: 2 },
  { label: "5 Min", value: 5 },
  { label: "10 Min", value: 10 },
];

export default function RandomQuizSetupModal({
  title,
  questionLabel,
  quantityLabel = "Questions",
  quantity,
  onQuantityChange,
  timerMinutes,
  onTimerChange,
  onCancel,
  onStart,
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="imlaa-card w-full max-w-md p-6 bg-white border border-plum/20 shadow-2xl space-y-6 my-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-2xl font-black text-body-dark">{title}</h3>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-label block mb-2">
            {questionLabel}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[10, 20, 50].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onQuantityChange(value)}
                className={`py-2 rounded-xl font-bold border transition ${
                  quantity === value
                    ? "bg-plum text-white border-plum"
                    : "border-plum/20 text-body-dark hover:bg-plum/5"
                }`}
              >
                {value} {quantityLabel}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-label block mb-2">
            Timer Limit
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIMER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onTimerChange(option.value)}
                className={`py-2 rounded-xl font-bold border transition ${
                  timerMinutes === option.value
                    ? "bg-plum text-white border-plum"
                    : "border-plum/20 text-body-dark hover:bg-plum/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-plum/10">
          <button
            type="button"
            onClick={onCancel}
            className="imlaa-btn-secondary py-2 px-4 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onStart}
            className="imlaa-btn-primary py-2 px-5 text-sm font-bold"
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
