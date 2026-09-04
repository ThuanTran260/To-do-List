'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'flowstate_pomodoro_focus_minutes';

export function usePomodoro(initialFocusMinutes = 25, initialBreakMinutes = 5) {
  const [focusMinutes, setFocusMinutesState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 720) return parsed;
      }
    }
    return initialFocusMinutes;
  });

  const [breakMinutes] = useState<number>(initialBreakMinutes);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(focusMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);

  const setFocusMinutes = useCallback((newMinutes: number) => {
    const validMins = Math.max(1, Math.min(720, Math.round(newMinutes)));
    setFocusMinutesState(validMins);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(validMins));
    }
    setMode('focus');
    setIsActive(false);
    setSecondsLeft(validMins * 60);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false);

      if (mode === 'focus') {
        toast.success(`🎉 Đã hoàn thành 1 phiên tập trung (${focusMinutes} phút)! Giờ là lúc nghỉ ngơi ${breakMinutes} phút.`);
        setMode('break');
        setSecondsLeft(breakMinutes * 60);
      } else {
        toast.success('🔔 Hết giờ nghỉ! Sẵn sàng cho phiên tập trung tiếp theo.');
        setMode('focus');
        setSecondsLeft(focusMinutes * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, mode, focusMinutes, breakMinutes]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    mode,
    focusMinutes,
    setFocusMinutes,
    secondsLeft,
    formattedTime,
    isActive,
    activeTaskTitle,
    setActiveTaskTitle,
    toggleTimer,
    resetTimer,
  };
}
