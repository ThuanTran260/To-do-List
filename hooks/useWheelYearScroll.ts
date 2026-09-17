'use client';

import { useRef, useCallback, useEffect } from 'react';

interface UseWheelMonthScrollProps {
  onMonthChange: (deltaMonths: number) => void;
  cooldownMs?: number;
  threshold?: number;
  debounceMs?: number;
}

/**
 * Custom hook to handle mouse wheel scrolling inside date/calendar containers.
 * - Attaches native non-passive listener with { passive: false }
 * - Completely isolates page scroll (preventDefault + stopPropagation)
 * - Normalizes deltaMode across browsers (0: pixel, 1: line * 33, 2: page * 100)
 * - Absorbs trackpad inertia momentum with 180ms cooldown lock
 * - Cleans up event listeners on unmount
 * - Preserves internal scrolling for scrollable child containers (.overflow-y-auto)
 */
export function useWheelMonthScroll({
  onMonthChange,
  cooldownMs = 180,
  threshold = 40,
  debounceMs,
}: UseWheelMonthScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTime = useRef<number>(0);
  const accumulatedDelta = useRef<number>(0);

  const effectiveCooldown = cooldownMs ?? debounceMs ?? 180;

  const handleWheelCore = useCallback(
    (e: WheelEvent | React.WheelEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement | null) ?? null;
      const scrollableParent = target?.closest('.overflow-y-auto, .overflow-y-scroll');

      // If user is wheeling inside an internal scrollable list with actual overflow,
      // let it scroll internally without changing the calendar month or leaking to page
      if (scrollableParent && scrollableParent.scrollHeight > scrollableParent.clientHeight) {
        e.stopPropagation();
        return;
      }

      e.stopPropagation();
      if (e.cancelable) {
        e.preventDefault();
      }

      const now = Date.now();

      // Absorb trackpad inertia if within cooldown window
      if (now - lastScrollTime.current < effectiveCooldown) {
        accumulatedDelta.current = 0;
        return;
      }

      // Normalize deltaMode
      const normalizedDelta =
        e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;

      accumulatedDelta.current += normalizedDelta;

      if (Math.abs(accumulatedDelta.current) >= threshold) {
        const deltaMonths = accumulatedDelta.current > 0 ? 1 : -1;
        onMonthChange(deltaMonths);
        lastScrollTime.current = now;
        accumulatedDelta.current = 0;
      }
    },
    [onMonthChange, effectiveCooldown, threshold]
  );

  // Attach native non-passive wheel listener directly to container element
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const nativeHandler = (e: WheelEvent) => {
      handleWheelCore(e);
    };

    el.addEventListener('wheel', nativeHandler, { passive: false });
    return () => {
      el.removeEventListener('wheel', nativeHandler);
    };
  }, [handleWheelCore]);

  // Provide synthetic handleWheel handler for React components or fallbacks
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      handleWheelCore(e);
    },
    [handleWheelCore]
  );

  return { containerRef, handleWheel };
}

// Retain alias for backwards compatibility
export const useWheelYearScroll = useWheelMonthScroll;
