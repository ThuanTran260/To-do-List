'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const STORAGE_KEY_V2 = 'flowstate_pomodoro_focus_v2';
export const LEGACY_STORAGE_KEY = 'flowstate_pomodoro_focus_minutes';

export interface PomodoroStorageV2 {
  v: 2;
  mins: number;
  secs: number;
}

export function usePomodoro(initialFocusMinutes = 25, initialBreakMinutes = 5) {
  // SSR-deterministic initial state: matches server render exactly
  const initialMins = Math.min(120, Math.max(0, initialFocusMinutes));
  const [focusMinutes, setFocusMinutesState] = useState<number>(initialMins);
  const [focusSeconds, setFocusSecondsState] = useState<number>(0);
  const [breakMinutes] = useState<number>(initialBreakMinutes);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState<number>(initialMins * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);

  const saveToStorage = useCallback((m: number, s: number) => {
    if (typeof window !== 'undefined') {
      const data: PomodoroStorageV2 = { v: 2, mins: m, secs: s };
      try {
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data));
      } catch {
        // Storage full / disabled fallback
      }
    }
  }, []);

  const setFocusTime = useCallback(
    (newMinutes: number, newSeconds: number) => {
      const validMins = Math.max(0, Math.min(120, Math.round(newMinutes)));
      const validSecs = Math.max(0, Math.min(59, Math.round(newSeconds)));
      setFocusMinutesState(validMins);
      setFocusSecondsState(validSecs);
      setMode('focus');
      setIsActive(false);
      setSecondsLeft(validMins * 60 + validSecs);
      saveToStorage(validMins, validSecs);
    },
    [saveToStorage]
  );

  const setFocusMinutes = useCallback(
    (newMinutes: number) => {
      const validMins = Math.max(0, Math.min(120, Math.round(newMinutes)));
      setFocusMinutesState(validMins);
      setMode('focus');
      setIsActive(false);
      setSecondsLeft(validMins * 60 + focusSeconds);
      saveToStorage(validMins, focusSeconds);
    },
    [focusSeconds, saveToStorage]
  );

  const setFocusSeconds = useCallback(
    (newSeconds: number) => {
      const validSecs = Math.max(0, Math.min(59, Math.round(newSeconds)));
      setFocusSecondsState(validSecs);
      setMode('focus');
      setIsActive(false);
      setSecondsLeft(focusMinutes * 60 + validSecs);
      saveToStorage(focusMinutes, validSecs);
    },
    [focusMinutes, saveToStorage]
  );

  // Post-mount hydration sync: safely read localStorage and update state on client only
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const v2Raw = localStorage.getItem(STORAGE_KEY_V2);
      if (v2Raw) {
        const parsed = JSON.parse(v2Raw);
        if (
          parsed &&
          parsed.v === 2 &&
          typeof parsed.mins === 'number' &&
          typeof parsed.secs === 'number'
        ) {
          const clampedMins = Math.max(0, Math.min(120, Math.round(parsed.mins)));
          const clampedSecs = Math.max(0, Math.min(59, Math.round(parsed.secs)));
          // Fallback if 00:00 was saved in storage
          if (clampedMins === 0 && clampedSecs === 0) {
            setFocusTime(25, 0);
          } else {
            setFocusTime(clampedMins, clampedSecs);
          }
          return;
        }
      }

      // Check legacy key for one-time migration
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const parsedLegacy = parseInt(legacyRaw, 10);
        if (!isNaN(parsedLegacy) && parsedLegacy > 0) {
          const clampedMins = Math.max(1, Math.min(120, parsedLegacy));
          saveToStorage(clampedMins, 0);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          setFocusTime(clampedMins, 0);
          return;
        }
      }
    } catch {
      // Storage corrupted fallback
    }
  }, [saveToStorage, setFocusTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false);

      if (mode === 'focus') {
        const timeDesc =
          focusSeconds > 0
            ? `${focusMinutes} phút ${focusSeconds} giây`
            : `${focusMinutes} phút`;
        toast.success(`🎉 Đã hoàn thành 1 phiên tập trung (${timeDesc})! Giờ là lúc nghỉ ngơi ${breakMinutes} phút.`);
        setMode('break');
        setSecondsLeft(breakMinutes * 60);
      } else {
        toast.success('🔔 Hết giờ nghỉ! Sẵn sàng cho phiên tập trung tiếp theo.');
        setMode('focus');
        setSecondsLeft(focusMinutes * 60 + focusSeconds);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, mode, focusMinutes, focusSeconds, breakMinutes]);

  const toggleTimer = () => {
    if (secondsLeft <= 0) return;
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(mode === 'focus' ? focusMinutes * 60 + focusSeconds : breakMinutes * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    mode,
    focusMinutes,
    focusSeconds,
    setFocusMinutes,
    setFocusSeconds,
    setFocusTime,
    breakMinutes,
    secondsLeft,
    formattedTime,
    isActive,
    activeTaskTitle,
    setActiveTaskTitle,
    toggleTimer,
    resetTimer,
  };
}
