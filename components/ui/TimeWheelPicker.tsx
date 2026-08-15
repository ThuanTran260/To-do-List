'use client';

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import { Sparkles, Check } from 'lucide-react';

interface TimeWheelPickerProps {
  hours: string;
  minutes: string;
  onChangeHours: (h: string) => void;
  onChangeMinutes: (m: string) => void;
  onConfirm: () => void;
}

const ITEM_HEIGHT = 36; // 36px height per item
const CONTAINER_HEIGHT = 180; // 180px total height of wheel column
const CENTER_OFFSET = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 72px offset to position selected item exactly in center lens
const DEBOUNCE_MS = 60; // 60ms step lock for wheel scroll

export function TimeWheelPicker({
  hours,
  minutes,
  onChangeHours,
  onChangeMinutes,
  onConfirm,
}: TimeWheelPickerProps) {
  const currentHoursInt = parseInt(hours, 10) || 0;
  const currentMinutesInt = parseInt(minutes, 10) || 0;

  const lastHourScroll = useRef<number>(0);
  const lastMinScroll = useRef<number>(0);

  // Touch & Mouse Drag Tracking Refs for Hours Column
  const touchStartHourY = useRef<number | null>(null);
  const initialHourVal = useRef<number>(currentHoursInt);
  const isMouseDraggingHour = useRef<boolean>(false);

  // Touch & Mouse Drag Tracking Refs for Minutes Column
  const touchStartMinY = useRef<number | null>(null);
  const initialMinVal = useRef<number>(currentMinutesInt);
  const isMouseDraggingMin = useRef<boolean>(false);

  // Mouse Wheel Handlers (Desktop Mouse Wheel)
  const handleHoursWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();

      const now = Date.now();
      if (now - lastHourScroll.current > DEBOUNCE_MS) {
        lastHourScroll.current = now;
        const delta = e.deltaY > 0 ? 1 : -1;
        const nextHours = (currentHoursInt + delta + 24) % 24;
        onChangeHours(String(nextHours).padStart(2, '0'));
      }
    },
    [currentHoursInt, onChangeHours]
  );

  const handleMinutesWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();

      const now = Date.now();
      if (now - lastMinScroll.current > DEBOUNCE_MS) {
        lastMinScroll.current = now;
        const delta = e.deltaY > 0 ? 1 : -1;
        const nextMinutes = (currentMinutesInt + delta + 60) % 60;
        onChangeMinutes(String(nextMinutes).padStart(2, '0'));
      }
    },
    [currentMinutesInt, onChangeMinutes]
  );

  // Touch Handlers for Hours
  const handleHoursTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    touchStartHourY.current = e.touches[0].clientY;
    initialHourVal.current = currentHoursInt;
  };

  const handleHoursTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    if (touchStartHourY.current === null) return;

    const currentY = e.touches[0].clientY;
    const deltaY = touchStartHourY.current - currentY;
    const stepOffset = Math.round(deltaY / ITEM_HEIGHT);

    let nextHours = (initialHourVal.current + stepOffset) % 24;
    if (nextHours < 0) nextHours += 24;

    if (nextHours !== currentHoursInt) {
      onChangeHours(String(nextHours).padStart(2, '0'));
    }
  };

  const handleHoursTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    touchStartHourY.current = null;
  };

  // Mouse Drag Handlers for Hours
  const handleHoursMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isMouseDraggingHour.current = true;
    touchStartHourY.current = e.clientY;
    initialHourVal.current = currentHoursInt;
  };

  const handleHoursMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDraggingHour.current || touchStartHourY.current === null) return;
    e.stopPropagation();

    const deltaY = touchStartHourY.current - e.clientY;
    const stepOffset = Math.round(deltaY / ITEM_HEIGHT);

    let nextHours = (initialHourVal.current + stepOffset) % 24;
    if (nextHours < 0) nextHours += 24;

    if (nextHours !== currentHoursInt) {
      onChangeHours(String(nextHours).padStart(2, '0'));
    }
  };

  const handleHoursMouseUp = () => {
    isMouseDraggingHour.current = false;
    touchStartHourY.current = null;
  };

  // Touch Handlers for Minutes
  const handleMinutesTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    touchStartMinY.current = e.touches[0].clientY;
    initialMinVal.current = currentMinutesInt;
  };

  const handleMinutesTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    if (touchStartMinY.current === null) return;

    const currentY = e.touches[0].clientY;
    const deltaY = touchStartMinY.current - currentY;
    const stepOffset = Math.round(deltaY / ITEM_HEIGHT);

    let nextMinutes = (initialMinVal.current + stepOffset) % 60;
    if (nextMinutes < 0) nextMinutes += 60;

    if (nextMinutes !== currentMinutesInt) {
      onChangeMinutes(String(nextMinutes).padStart(2, '0'));
    }
  };

  const handleMinutesTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    touchStartMinY.current = null;
  };

  // Mouse Drag Handlers for Minutes
  const handleMinutesMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isMouseDraggingMin.current = true;
    touchStartMinY.current = e.clientY;
    initialMinVal.current = currentMinutesInt;
  };

  const handleMinutesMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDraggingMin.current || touchStartMinY.current === null) return;
    e.stopPropagation();

    const deltaY = touchStartMinY.current - e.clientY;
    const stepOffset = Math.round(deltaY / ITEM_HEIGHT);

    let nextMinutes = (initialMinVal.current + stepOffset) % 60;
    if (nextMinutes < 0) nextMinutes += 60;

    if (nextMinutes !== currentMinutesInt) {
      onChangeMinutes(String(nextMinutes).padStart(2, '0'));
    }
  };

  const handleMinutesMouseUp = () => {
    isMouseDraggingMin.current = false;
    touchStartMinY.current = null;
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={springPillMotion}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }}
      className="absolute bottom-12 right-0 z-[9999] p-3.5 rounded-xl surface-panel bg-surface-1 border border-hairline shadow-2xl space-y-3 w-72 text-ink select-none touch-none overscroll-contain"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-hairline">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>CHỌN GIỜ</span>
        </span>
        <button
          type="button"
          onClick={onConfirm}
          className="px-2.5 py-1 rounded-md bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium transition-colors shadow-xs active:scale-98 flex items-center gap-1 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Xác nhận</span>
        </button>
      </div>

      {/* Controlled Framer Motion 3D Wheel Container */}
      <div
        className="flex items-center justify-center gap-3 relative overflow-hidden rounded-lg bg-surface-2 p-2 border border-hairline touch-none overscroll-contain"
        style={{ height: `${CONTAINER_HEIGHT}px` }}
      >
        {/* Lens Highlight Center Bar */}
        <div
          style={{
            height: `${ITEM_HEIGHT}px`,
            top: `${CENTER_OFFSET + 8}px`,
          }}
          className="absolute inset-x-3 rounded-md bg-primary-subtle border border-primary-border pointer-events-none z-0"
        />

        {/* Hours Wheel Column */}
        <div
          onWheel={handleHoursWheel}
          onTouchStart={handleHoursTouchStart}
          onTouchMove={handleHoursTouchMove}
          onTouchEnd={handleHoursTouchEnd}
          onMouseDown={handleHoursMouseDown}
          onMouseMove={handleHoursMouseMove}
          onMouseUp={handleHoursMouseUp}
          onMouseLeave={handleHoursMouseUp}
          className="w-28 h-full relative overflow-hidden flex flex-col items-center cursor-grab active:cursor-grabbing z-10 touch-none select-none"
        >
          <motion.div
            animate={{ y: CENTER_OFFSET - currentHoursInt * ITEM_HEIGHT }}
            transition={springPillMotion}
            className="flex flex-col items-center w-full pointer-events-none"
          >
            {hoursList.map((val, idx) => {
              const distance = Math.abs(idx - currentHoursInt);
              const isSelected = idx === currentHoursInt;

              return (
                <div
                  key={val}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                  className="w-full flex items-center justify-center text-center transition-all duration-150"
                >
                  <span
                    className={`font-mono text-sm transition-all duration-150 ${
                      isSelected
                        ? 'text-primary font-semibold text-base px-2 py-0.5 rounded'
                        : distance === 1
                        ? 'text-ink font-medium opacity-70'
                        : 'text-ink-subtle font-normal opacity-40'
                    }`}
                  >
                    {val}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Center Separator Colon */}
        <span className="font-mono text-base font-semibold text-primary z-10">:</span>

        {/* Minutes Wheel Column */}
        <div
          onWheel={handleMinutesWheel}
          onTouchStart={handleMinutesTouchStart}
          onTouchMove={handleMinutesTouchMove}
          onTouchEnd={handleMinutesTouchEnd}
          onMouseDown={handleMinutesMouseDown}
          onMouseMove={handleMinutesMouseMove}
          onMouseUp={handleMinutesMouseUp}
          onMouseLeave={handleMinutesMouseUp}
          className="w-28 h-full relative overflow-hidden flex flex-col items-center cursor-grab active:cursor-grabbing z-10 touch-none select-none"
        >
          <motion.div
            animate={{ y: CENTER_OFFSET - currentMinutesInt * ITEM_HEIGHT }}
            transition={springPillMotion}
            className="flex flex-col items-center w-full pointer-events-none"
          >
            {minutesList.map((val, idx) => {
              const distance = Math.abs(idx - currentMinutesInt);
              const isSelected = idx === currentMinutesInt;

              return (
                <div
                  key={val}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                  className="w-full flex items-center justify-center text-center transition-all duration-150"
                >
                  <span
                    className={`font-mono text-sm transition-all duration-150 ${
                      isSelected
                        ? 'text-primary font-semibold text-base px-2 py-0.5 rounded'
                        : distance === 1
                        ? 'text-ink font-medium opacity-70'
                        : 'text-ink-subtle font-normal opacity-40'
                    }`}
                  >
                    {val}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
