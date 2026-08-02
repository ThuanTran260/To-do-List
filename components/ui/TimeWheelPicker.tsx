'use client';

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import { Sparkles } from 'lucide-react';

interface TimeWheelPickerProps {
  hours: string;
  minutes: string;
  onChangeHours: (h: string) => void;
  onChangeMinutes: (m: string) => void;
  onConfirm: () => void;
}

const ITEM_HEIGHT = 36; // 36px per item
const DEBOUNCE_MS = 60; // 60ms step lock

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

  // Wheel listener for Hours Column: Exactly 1 hour per wheel tick
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

  // Wheel listener for Minutes Column: Exactly 1 minute per wheel tick
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

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={springPillMotion}
      onWheel={(e) => e.stopPropagation()}
      className="absolute bottom-12 right-0 z-50 p-4 rounded-3xl bg-slate-900 dark:bg-slate-950 border border-slate-700/80 shadow-2xl space-y-3 w-64 text-slate-100 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Chọn giờ</span>
        </span>
        <button
          type="button"
          onClick={onConfirm}
          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold transition-colors shadow-sm active:scale-95"
        >
          Xác nhận
        </button>
      </div>

      {/* Controlled Framer Motion 3D Wheel Container */}
      <div className="flex items-center justify-center gap-2 relative h-44 overflow-hidden">
        {/* Glass Lens Highlight Center Bar */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-9 rounded-xl bg-indigo-500/25 border border-indigo-500/40 pointer-events-none z-0 shadow-inner" />

        {/* Hours Wheel Column */}
        <div
          onWheel={handleHoursWheel}
          className="w-24 h-full relative overflow-hidden flex flex-col items-center justify-center cursor-grab active:cursor-grabbing z-10"
        >
          <motion.div
            animate={{ y: (1 - currentHoursInt) * ITEM_HEIGHT }}
            transition={springPillMotion}
            className="flex flex-col items-center space-y-0"
          >
            {hoursList.map((val, idx) => {
              const distance = Math.abs(idx - currentHoursInt);
              const isSelected = idx === currentHoursInt;
              const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.2;
              const scale = distance === 0 ? 1.15 : distance === 1 ? 0.9 : 0.75;

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChangeHours(val)}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                  className={`w-full flex items-center justify-center text-sm font-mono transition-all duration-150 ${
                    isSelected
                      ? 'text-indigo-300 font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span style={{ opacity, transform: `scale(${scale})` }}>{val}</span>
                </button>
              );
            })}
          </motion.div>
        </div>

        <span className="font-mono text-base font-black text-indigo-400 z-10 animate-pulse">:</span>

        {/* Minutes Wheel Column */}
        <div
          onWheel={handleMinutesWheel}
          className="w-24 h-full relative overflow-hidden flex flex-col items-center justify-center cursor-grab active:cursor-grabbing z-10"
        >
          <motion.div
            animate={{ y: (1 - currentMinutesInt) * ITEM_HEIGHT }}
            transition={springPillMotion}
            className="flex flex-col items-center space-y-0"
          >
            {minutesList.map((val, idx) => {
              const distance = Math.abs(idx - currentMinutesInt);
              const isSelected = idx === currentMinutesInt;
              const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.2;
              const scale = distance === 0 ? 1.15 : distance === 1 ? 0.9 : 0.75;

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChangeMinutes(val)}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                  className={`w-full flex items-center justify-center text-sm font-mono transition-all duration-150 ${
                    isSelected
                      ? 'text-indigo-300 font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span style={{ opacity, transform: `scale(${scale})` }}>{val}</span>
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
