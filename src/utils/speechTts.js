import { supabase } from "../services/supabaseClient";
import { telemetry } from "../services/telemetryService";

/**
 * High-fidelity Speech Synthesis utility with In-Memory Caching,
 * Supabase Storage CDN Streaming, and Instant Browser Fallback
 * - Checks in-memory Map first for instant zero-latency repeat playback
 * - Streams directly from Supabase Storage CDN if audio_url exists (bypassing Render)
 * - Requests backend synthesis to upload new words once to Supabase CDN
 * - Falls back seamlessly to native SpeechSynthesis if server times out (> 2.8s)
 */

let activeAudio = null;

// In-memory HTML5 Audio element cache to avoid repeat network requests in single session
const audioMemoryCache = new Map();

export async function speakWithMicrosoftTTS(text, {
  voice = "en-US-ChristopherNeural",
  vocabId = null,
  audioUrl = null,
  onStart,
  onEnd,
  onError,
} = {}) {
  const cleanText = (text || "").trim();
  if (!cleanText) return;

  // Stop any active audio immediately before starting a new one
  stopAudioPlayback();

  const cacheKey = (vocabId || cleanText).toLowerCase();

  const fallbackToSpeechSynthesis = () => {
    activeAudio = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.85; // Natural articulated pace for dictation

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Natural") ||
              v.name.includes("Online") ||
              v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("Daniel")),
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };
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

  // 1. Instant Playback from In-Memory Cache
  if (audioMemoryCache.has(cacheKey)) {
    try {
      const cachedAudio = audioMemoryCache.get(cacheKey);
      activeAudio = cachedAudio;
      cachedAudio.currentTime = 0;

      if (onStart) onStart();

      cachedAudio.onended = () => {
        activeAudio = null;
        if (onEnd) onEnd();
      };

      cachedAudio.onerror = () => {
        fallbackToSpeechSynthesis();
      };

      await cachedAudio.play();
      return;
    } catch {
      // Fall through to network or speech synthesis
    }
  }

  // 2. Direct CDN Streaming if audioUrl is already resolved
  if (audioUrl && typeof audioUrl === "string" && audioUrl.startsWith("http")) {
    try {
      const audio = new Audio(audioUrl);
      audioMemoryCache.set(cacheKey, audio);
      activeAudio = audio;

      if (onStart) onStart();

      audio.onended = () => {
        activeAudio = null;
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        fallbackToSpeechSynthesis();
      };

      await audio.play();
      return;
    } catch {
      // Fall through
    }
  }

  // 3. Request Backend Synthesis & CDN Caching
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
      "https://www.api.spellycraft.com";
    const synthEndpoint = `${backendBase}/api/audio/synthesize`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);

    let resolvedPlayUrl = null;
    let fallbackBlob = null;

    try {
      const response = await fetch(synthEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: cleanText, vocabId, voice }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`TTS server responded with ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        if (json.audioUrl) {
          resolvedPlayUrl = json.audioUrl;
        }
      } else {
        fallbackBlob = await response.blob();
      }

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
      fallbackToSpeechSynthesis();
      return;
    }

    // Play either the resolved Supabase CDN URL or the stream Blob
    let audio;
    let objectUrlToRevoke = null;

    if (resolvedPlayUrl) {
      audio = new Audio(resolvedPlayUrl);
      audioMemoryCache.set(cacheKey, audio);
    } else if (fallbackBlob) {
      objectUrlToRevoke = URL.createObjectURL(fallbackBlob);
      audio = new Audio(objectUrlToRevoke);
      audioMemoryCache.set(cacheKey, audio);
    } else {
      fallbackToSpeechSynthesis();
      return;
    }

    activeAudio = audio;
    if (onStart) onStart();

    audio.onended = () => {
      activeAudio = null;
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
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
