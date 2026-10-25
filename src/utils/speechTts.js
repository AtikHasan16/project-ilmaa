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

    audio.onerror = (e) => {
      console.error("[Microsoft TTS Playback Error] Audio element failed to load from:", audioUrl, e);
      activeAudio = null;
      if (onError) onError(new Error(`Failed to load Microsoft Edge TTS from ${audioUrl}`));
      if (onEnd) onEnd();
    };

    await audio.play();
  } catch (err) {
    console.error("[Microsoft TTS Error]", err);
    activeAudio = null;
    if (onError) onError(err);
    if (onEnd) onEnd();
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
