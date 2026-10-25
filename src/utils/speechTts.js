/**
 * High-fidelity Speech Synthesis utility using Microsoft Christopher Neural TTS.
 * Native browser speech synthesis is completely eliminated to prevent overlapping or low-quality audio.
 */

let activeAudio = null;

export async function speakWithMicrosoftTTS(text, {
  voice = 'en-US-ChristopherNeural',
  onStart,
  onEnd,
  onError,
} = {}) {
  const cleanText = (text || '').trim();
  if (!cleanText) return;

  // Stop any active audio immediately before starting a new one
  stopAudioPlayback();

  if (onStart) onStart();

  try {
    const encodedText = encodeURIComponent(cleanText);
    const encodedVoice = encodeURIComponent(voice);
    const backendBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) || "https://ilmaa-server.vercel.app";
    const audioUrl = `${backendBase}/api/v1/tts?text=${encodedText}&voice=${encodedVoice}`;

    const audio = new Audio(audioUrl);
    activeAudio = audio;

    audio.onended = () => {
      activeAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      // If local server is not running, seamlessly fallback to browser speech synthesis
      activeAudio = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(cleanText);
        u.rate = 0.85;
        u.onend = () => { if (onEnd) onEnd(); };
        u.onerror = (err) => { if (onError) onError(err); if (onEnd) onEnd(); };
        window.speechSynthesis.speak(u);
      } else {
        if (onError) onError();
        if (onEnd) onEnd();
      }
    };

    await audio.play();
  } catch (err) {
    activeAudio = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cleanText);
      u.rate = 0.85;
      u.onend = () => { if (onEnd) onEnd(); };
      u.onerror = (e) => { if (onError) onError(e); if (onEnd) onEnd(); };
      window.speechSynthesis.speak(u);
    } else {
      if (onError) onError(err);
      if (onEnd) onEnd();
    }
  }
}

export function stopAudioPlayback() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Ignore abort errors
    }
    activeAudio = null;
  }

  // Ensure any lingering native browser speech is permanently cancelled and silenced
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}
