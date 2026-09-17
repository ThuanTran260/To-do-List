'use client';

import React, { useRef, useEffect, useCallback } from 'react';

export interface WheelPickerColumnProps {
  value: number;
  onChange: (val: number) => void;
  min?: number; // default 1
  max?: number; // default 120
  step?: number; // default 1
  pageStep?: number; // default 15
  unit?: string;
  formatLabel?: (v: number) => string;
  ariaLabel?: string;
  className?: string;
  loop?: boolean;
}

const ITEM_HEIGHT = 36; // 36px per row
const CONTAINER_HEIGHT = 180; // 180px column height
const CENTER_OFFSET = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 72px center offset

export function WheelPickerColumn({
  value,
  onChange,
  min = 1,
  max = 120,
  step = 1,
  pageStep = 15,
  unit,
  formatLabel,
  ariaLabel,
  className = '',
  loop = false,
}: WheelPickerColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const wheelAccumulator = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const startY = useRef<number>(0);
  const startValue = useRef<number>(value);
  const typeAheadBuffer = useRef<string>('');
  const typeAheadTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-clamp guard for safety
  const safeValue = Math.min(max, Math.max(min, value));
  useEffect(() => {
    if (value !== safeValue) {
      onChange(safeValue);
    }
  }, [value, safeValue, onChange]);

  // Clamp or loop value logic
  const clampOrLoop = useCallback(
    (val: number): number => {
      if (loop) {
        const range = max - min + 1;
        return ((((val - min) % range) + range) % range) + min;
      }
      return Math.min(max, Math.max(min, val));
    },
    [loop, min, max]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = clampOrLoop(safeValue + step);
      onChange(next);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = clampOrLoop(safeValue - step);
      onChange(next);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      const next = clampOrLoop(safeValue + pageStep);
      onChange(next);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      const next = clampOrLoop(safeValue - pageStep);
      onChange(next);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      if (typeAheadTimeout.current) {
        clearTimeout(typeAheadTimeout.current);
      }
      typeAheadBuffer.current += e.key;
      const parsed = parseInt(typeAheadBuffer.current, 10);
      if (!isNaN(parsed)) {
        onChange(clampOrLoop(parsed));
      }
      typeAheadTimeout.current = setTimeout(() => {
        typeAheadBuffer.current = '';
      }, 700);
    }
  };

  // Mouse Wheel processing
  const processWheel = useCallback(
    (e: WheelEvent | React.WheelEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();

      const normalizedDelta =
        e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;

      wheelAccumulator.current += normalizedDelta;
      const threshold = ITEM_HEIGHT;

      if (Math.abs(wheelAccumulator.current) >= threshold) {
        const steps = Math.trunc(wheelAccumulator.current / threshold);
        wheelAccumulator.current -= steps * threshold;

        const next = clampOrLoop(safeValue + steps * step);
        if (next !== safeValue) {
          onChange(next);
        }
      }
    },
    [clampOrLoop, safeValue, step, onChange]
  );

  // Native non-passive wheel listener attachment
  useEffect(() => {
    const el = columnRef.current;
    if (!el) return;

    const nativeWheelHandler = (e: WheelEvent) => {
      processWheel(e);
    };

    el.addEventListener('wheel', nativeWheelHandler, { passive: false });
    return () => {
      el.removeEventListener('wheel', nativeWheelHandler);
    };
  }, [processWheel]);

  // Pointer drag handling with pointer capture
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = safeValue;
    wheelAccumulator.current = 0;

    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Fallback for mock environments
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    const deltaY = startY.current - e.clientY;
    const steps = Math.round(deltaY / ITEM_HEIGHT);
    const next = clampOrLoop(startValue.current + steps * step);

    if (next !== safeValue) {
      onChange(next);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Fallback for mock environments
      }
    }
  };

  // Virtual window calculation (|idx - current| <= 2)
  const visibleItems: { offset: number; val: number }[] = [];
  const range = max - min + 1;
  for (let offset = -2; offset <= 2; offset++) {
    let itemVal = safeValue + offset * step;
    if (loop) {
      itemVal = ((((itemVal - min) % range) + range) % range) + min;
    } else if (itemVal < min || itemVal > max) {
      continue;
    }
    visibleItems.push({ offset, val: itemVal });
  }

  const ariaValueText = formatLabel
    ? formatLabel(safeValue)
    : unit
    ? `${safeValue} ${unit}`
    : String(safeValue);

  return (
    <div
      ref={columnRef}
      role="spinbutton"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuenow={safeValue}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={ariaValueText}
      onKeyDown={handleKeyDown}
      onWheel={(e) => processWheel(e)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        height: `${CONTAINER_HEIGHT}px`,
        perspective: '600px',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
      }}
      className={`relative w-24 h-full overflow-hidden flex flex-col items-center justify-center cursor-grab active:cursor-grabbing z-10 touch-none select-none overscroll-contain focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded-lg ${className}`}
    >
      {/* 3D Drum Virtual Item Window */}
      <div
        className="w-full h-full relative pointer-events-none"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {visibleItems.map(({ offset, val }) => {
          const distance = Math.abs(offset);
          const isSelected = offset === 0;
          const displayLabel = formatLabel ? formatLabel(val) : String(val);

          // 3D cylinder transform
          const rotateX = -offset * 25; // 25 degrees per step
          const translateY = CENTER_OFFSET + offset * ITEM_HEIGHT;
          const scale = isSelected ? 1.05 : distance === 1 ? 0.95 : 0.85;

          return (
            <div
              key={`${offset}-${val}`}
              data-wheel-item={val}
              style={{
                height: `${ITEM_HEIGHT}px`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${translateY}px) rotateX(${rotateX}deg) scale(${scale})`,
                transformOrigin: 'center center',
              }}
              className="flex items-center justify-center text-center transition-all duration-150"
            >
              <span
                className={`font-mono text-sm select-none transition-all duration-150 ${
                  isSelected
                    ? 'text-primary font-semibold text-base px-2 py-0.5 rounded'
                    : distance === 1
                    ? 'text-ink font-medium opacity-70'
                    : 'text-ink-subtle font-normal opacity-40'
                }`}
              >
                {displayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
