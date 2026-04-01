import { useEffect, useRef, useState } from 'react';

export function useProgressTracking(isSubmitting) {
  const [progress, setProgress] = useState(10);
  const progressTimerRef = useRef(null);

  useEffect(() => {
    if (!isSubmitting) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
      return undefined;
    }

    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) {
          return current;
        }
        const step = current > 70 ? 3 : 7;
        return Math.min(current + step, 92);
      });
    }, 280);

    return () => {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    };
  }, [isSubmitting]);

  const resetProgress = () => {
    setProgress(10);
  };

  const completeProgress = () => {
    setProgress(100);
  };

  return {
    progress,
    resetProgress,
    completeProgress,
  };
}
