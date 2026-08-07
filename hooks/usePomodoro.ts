'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function usePomodoro(initialFocusMinutes = 25, initialBreakMinutes = 5) {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(initialFocusMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false);

      if (mode === 'focus') {
        toast.success('🎉 Đã hoàn thành 1 phiên Pomodoro (25 phút)! Giờ là lúc nghỉ ngơi 5 phút.');
        setMode('break');
        setSecondsLeft(initialBreakMinutes * 60);
      } else {
        toast.success('🔔 Hết giờ nghỉ! Sẵn sàng cho phiên tập trung tiếp theo.');
        setMode('focus');
        setSecondsLeft(initialFocusMinutes * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, mode, initialFocusMinutes, initialBreakMinutes]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(mode === 'focus' ? initialFocusMinutes * 60 : initialBreakMinutes * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    mode,
    secondsLeft,
    formattedTime,
    isActive,
    activeTaskTitle,
    setActiveTaskTitle,
    toggleTimer,
    resetTimer,
  };
}
