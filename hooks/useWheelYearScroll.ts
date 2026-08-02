'use client';

import { useRef, useCallback } from 'react';

interface UseWheelYearScrollProps {
  onYearChange: (delta: number) => void;
  debounceMs?: number;
}

/**
 * Custom hook to handle mouse wheel scrolling inside date/calendar containers.
 * Implements smooth debounced momentum decay to navigate between years/months
 * without chaotic jumping during rapid scrolling.
 */
export function useWheelYearScroll({
  onYearChange,
  debounceMs = 120,
}: UseWheelYearScrollProps) {
  const lastScrollTime = useRef<number>(0);
  const accumulatedDelta = useRef<number>(0);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      // Prevent page body scrolling when scrolling inside calendar
      e.stopPropagation();

      const now = Date.now();
      accumulatedDelta.current += e.deltaY;

      if (now - lastScrollTime.current > debounceMs) {
        if (Math.abs(accumulatedDelta.current) > 20) {
          const deltaYears = accumulatedDelta.current > 0 ? 1 : -1;
          onYearChange(deltaYears);
          lastScrollTime.current = now;
          accumulatedDelta.current = 0;
        }
      }
    },
    [onYearChange, debounceMs]
  );

  return { handleWheel };
}
