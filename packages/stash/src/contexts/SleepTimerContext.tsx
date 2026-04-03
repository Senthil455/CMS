import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';

interface SleepTimerContextType {
  /** Seconds remaining, or null when no timer is active */
  remaining: number | null;
  /** Start a countdown for the given number of seconds */
  start: (seconds: number) => void;
  /** Cancel the current timer */
  cancel: () => void;
  /** True when the timer has just expired (resets on next start/cancel) */
  expired: boolean;
}

const SleepTimerContext = createContext<SleepTimerContextType | null>(null);

export const SleepTimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    clearTimer();
    setRemaining(null);
    setExpired(false);
  }, [clearTimer]);

  const start = useCallback((seconds: number) => {
    cancel();
    setRemaining(seconds);
    setExpired(false);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearTimer();
          setExpired(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cancel, clearTimer]);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  return (
    <SleepTimerContext.Provider value={{ remaining, start, cancel, expired }}>
      {children}
    </SleepTimerContext.Provider>
  );
};

export const useSleepTimer = () => {
  const context = useContext(SleepTimerContext);
  if (!context) {
    throw new Error('useSleepTimer must be used within a SleepTimerProvider');
  }
  return context;
};
