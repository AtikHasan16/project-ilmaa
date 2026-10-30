import { supabase } from "../services/supabaseClient";
import { telemetry } from "../services/telemetryService";

/**
 * High-fidelity Speech Synthesis utility with Instant Browser Fallback
 * - Prioritizes Microsoft Christopher Neural TTS via backend
 * - If Render server is sleeping (cold start > 2.8s) or unreachable,
 *   seamlessly falls back to high-quality browser native speech synthesis
 *   so the student's study flow is never interrupted!
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
          (v.name.includes("Natural") ||
            v.name.includes("Online") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel"))
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

  const ttsStart = Date.now();
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      telemetry.trackTtsPerformance({
        durationMs: Date.now() - ttsStart,
        success: false,
        voice,
        fallbackUsed: true,
        error: sessionError || new Error("No active session"),
      });
      fallbackToSpeechSynthesis();
      return;
    }

    const backendBase =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
      "https://ilmaa-server.onrender.com";
    const audioUrl = `${backendBase}/api/tts`;

    // Fast check: Abort controller with 2.8s timeout to handle Render cold-start without blocking user
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);

    let blob;
    try {
      const response = await fetch(audioUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: cleanText, voice }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`TTS server responded with ${response.status}`);
      blob = await response.blob();
      telemetry.trackTtsPerformance({
        durationMs: Date.now() - ttsStart,
        success: true,
        voice,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      telemetry.trackTtsPerformance({
        durationMs: Date.now() - ttsStart,
        success: false,
        voice,
        fallbackUsed: true,
        error: fetchErr,
      });
      // Backend is sleeping on Render or error: trigger instant native speech fallback
      fallbackToSpeechSynthesis();
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    activeAudio = audio;

    audio.onended = () => {
      activeAudio = null;
      URL.revokeObjectURL(objectUrl);
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      fallbackToSpeechSynthesis();
    };

    await audio.play();
  } catch {
    fallbackToSpeechSynthesis();
  }
}

export function stopAudioPlayback() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    activeAudio = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

// Pre-load browser voices in advance so they are cached immediately
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}
