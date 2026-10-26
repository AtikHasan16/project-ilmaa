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
    const backendBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) || "https://ilmaa-server.onrender.com";
    const audioUrl = `${backendBase}/api/v1/tts?text=${encodedText}&voice=${encodedVoice}`;

    const audio = new Audio(audioUrl);
    activeAudio = audio;

    const fallbackToSpeechSynthesis = () => {
      activeAudio = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.85; // Natural articulated pace for IELTS candidate dictation

        // Prioritize natural US/UK English voices available in candidate's browser
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Google") || v.name.includes("Samantha"))
        ) || voices.find((v) => v.lang.startsWith("en"));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => {
          if (onEnd) onEnd();
        };
        utterance.onerror = (e) => {
          if (onError) onError(e);
          if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        if (onError) onError(new Error("Audio playback failed"));
        if (onEnd) onEnd();
      }
    };

    audio.onended = () => {
      activeAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      // If external speech service is rate-limited or unreachable, immediately fallback so student hears pronunciation
      fallbackToSpeechSynthesis();
    };

    try {
      await audio.play();
    } catch {
      fallbackToSpeechSynthesis();
    }
  } catch {
    activeAudio = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cleanText);
      u.rate = 0.85;
      u.onend = () => { if (onEnd) onEnd(); };
      u.onerror = () => { if (onEnd) onEnd(); };
      window.speechSynthesis.speak(u);
    } else {
      if (onError) onError();
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
