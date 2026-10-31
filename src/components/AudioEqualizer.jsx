/**
 * Animated audio equalizer bars representing active speech playback.
 * 4 vertical bars oscillating with varied delays for a natural phoneme-playback visualizer.
 */
export default function AudioEqualizer({ isPlaying = false, className = "" }) {
  if (!isPlaying) return null;

  return (
    <div
      role="status"
      aria-label="Synthesizing audio pronunciation"
      className={`inline-flex items-center space-x-0.5 h-4 px-1.5 py-0.5 rounded-md bg-plum/10 text-plum ${className}`}
    >
      <span className="w-1 bg-plum rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2.5" />
      <span className="w-1 bg-plum rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-4" />
      <span className="w-1 bg-plum rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2" />
      <span className="w-1 bg-plum rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3.5" />
    </div>
  );
}
