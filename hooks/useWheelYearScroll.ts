'use client';

import { useRef, useCallback } from 'react';

interface UseWheelMonthScrollProps {
  onMonthChange: (deltaMonths: number) => void;
  debounceMs?: number;
}

/**
 * Custom hook to handle mouse wheel scrolling inside date/calendar containers.
 * Navigates smoothly month by month with debounced momentum decay.
 */
export function useWheelMonthScroll({
  onMonthChange,
  debounceMs = 100,
}: UseWheelMonthScrollProps) {
  const lastScrollTime = useRef<number>(0);
  const accumulatedDelta = useRef<number>(0);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      // Prevent page body scrolling when scrolling inside calendar
      e.stopPropagation();

      const now = Date.now();
      accumulatedDelta.current += e.deltaY;

      if (now - lastScrollTime.current > debounceMs) {
        if (Math.abs(accumulatedDelta.current) > 15) {
          const deltaMonths = accumulatedDelta.current > 0 ? 1 : -1;
          onMonthChange(deltaMonths);
          lastScrollTime.current = now;
          accumulatedDelta.current = 0;
        }
      }
    },
    [onMonthChange, debounceMs]
  );

  return { handleWheel };
}

// Retain alias for backwards compatibility
export const useWheelYearScroll = useWheelMonthScroll;
