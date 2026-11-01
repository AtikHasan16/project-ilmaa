import { useState, useRef, useCallback, useEffect } from "react";
import { speakWithMicrosoftTTS, stopAudioPlayback } from "../utils/speechTts";

/**
 * useWordAudio: Production-ready React hook for word audio playback
 * - Handles in-memory caching of HTML5 Audio elements
 * - Streams directly from Supabase CDN when available
 * - Provides clean playing, loading, and error states
 */
export function useWordAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopAudioPlayback();
    };
  }, []);

  const playWord = useCallback(async (wordOrObj, options = {}) => {
    let wordText = "";
    let vocabId = null;
    let audioUrl = null;

    if (typeof wordOrObj === "string") {
      wordText = wordOrObj;
    } else if (wordOrObj && typeof wordOrObj === "object") {
      wordText = wordOrObj.word || wordOrObj.text || "";
      vocabId = wordOrObj.id || wordOrObj.vocabId || null;
      audioUrl = wordOrObj.audioUrl || wordOrObj.audio_url || null;
    }

    if (!wordText) return;

    setIsLoading(true);

    try {
      await speakWithMicrosoftTTS(wordText, {
        vocabId,
        audioUrl,
        voice: options.voice || "en-US-ChristopherNeural",
        onStart: () => {
          if (isMountedRef.current) {
            setIsLoading(false);
            setIsPlaying(true);
          }
          if (options.onStart) options.onStart();
        },
        onEnd: () => {
          if (isMountedRef.current) {
            setIsPlaying(false);
          }
          if (options.onEnd) options.onEnd();
        },
        onError: (err) => {
          if (isMountedRef.current) {
            setIsLoading(false);
            setIsPlaying(false);
          }
          if (options.onError) options.onError(err);
        },
      });
    } catch {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsPlaying(false);
      }
    }
  }, []);

  const stop = useCallback(() => {
    stopAudioPlayback();
    if (isMountedRef.current) {
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, []);

  return {
    playWord,
    stop,
    isPlaying,
    isLoading,
  };
}

export default useWordAudio;
