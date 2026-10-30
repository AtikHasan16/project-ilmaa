import { useCallback, useEffect, useRef } from "react";

export function useCountdownTimer(setRemaining, onExpire) {
  const timerRef = useRef(null);
  const remainingRef = useRef(0);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (minutes) => {
      stopTimer();
      remainingRef.current = Math.max(0, Number(minutes) || 0) * 60;
      setRemaining(remainingRef.current);
      if (remainingRef.current === 0) return;

      timerRef.current = setInterval(() => {
        remainingRef.current = Math.max(0, remainingRef.current - 1);
        setRemaining(remainingRef.current);
        if (remainingRef.current === 0) {
          stopTimer();
          onExpireRef.current?.();
        }
      }, 1000);
    },
    [setRemaining, stopTimer],
  );

  useEffect(() => stopTimer, [stopTimer]);

  return { startTimer, stopTimer };
}
