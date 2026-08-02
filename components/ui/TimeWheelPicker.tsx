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
const CENTER_OFFSET = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 72px offset to position selected item exactly in the center lens
const DEBOUNCE_MS = 70; // 70ms step lock

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
      className="absolute bottom-12 right-0 z-50 p-4 rounded-3xl bg-slate-900 dark:bg-slate-950 border border-slate-700/90 shadow-2xl space-y-3 w-72 text-slate-100 select-none"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Chọn giờ</span>
        </span>
        <button
          type="button"
          onClick={onConfirm}
          className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 active:scale-95 flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Xác nhận</span>
        </button>
      </div>

      {/* Controlled Framer Motion 3D Wheel Container */}
      <div
        className="flex items-center justify-center gap-3 relative overflow-hidden rounded-2xl bg-slate-950/80 p-2 border border-slate-800"
        style={{ height: `${CONTAINER_HEIGHT}px` }}
      >
        {/* Glass Lens Highlight Center Bar (Mathematically Centered at CENTER_OFFSET) */}
        <div
          style={{
            height: `${ITEM_HEIGHT}px`,
            top: `${CENTER_OFFSET + 8}px`,
          }}
          className="absolute inset-x-3 rounded-xl bg-gradient-to-r from-indigo-600/30 via-violet-600/40 to-indigo-600/30 border border-indigo-500/50 pointer-events-none z-0 shadow-md shadow-indigo-500/20"
        />

        {/* Hours Wheel Column */}
        <div
          onWheel={handleHoursWheel}
          className="w-28 h-full relative overflow-hidden flex flex-col items-center cursor-grab active:cursor-grabbing z-10"
        >
          <motion.div
            animate={{ y: CENTER_OFFSET - currentHoursInt * ITEM_HEIGHT }}
            transition={springPillMotion}
            className="flex flex-col items-center w-full"
          >
            {hoursList.map((val, idx) => {
              const distance = Math.abs(idx - currentHoursInt);
              const isSelected = idx === currentHoursInt;

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChangeHours(val)}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                  className="w-full flex items-center justify-center text-center transition-all duration-150"
                >
                  <span
                    className={`font-mono text-sm transition-all duration-150 ${
                      isSelected
                        ? 'text-white font-black text-base bg-indigo-600 px-3 py-0.5 rounded-lg shadow-md shadow-indigo-500/40 scale-105'
                        : distance === 1
                        ? 'text-slate-200 font-bold opacity-75'
                        : 'text-slate-400 font-medium opacity-40'
                    }`}
                  >
                    {val}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Center Separator Colon */}
        <span className="font-mono text-lg font-black text-indigo-400 z-10 animate-pulse">:</span>

        {/* Minutes Wheel Column */}
        <div
          onWheel={handleMinutesWheel}
          className="w-28 h-full relative overflow-hidden flex flex-col items-center cursor-grab active:cursor-grabbing z-10"
        >
          <motion.div
            animate={{ y: CENTER_OFFSET - currentMinutesInt * ITEM_HEIGHT }}
            transition={springPillMotion}
            className="flex flex-col items-center w-full"
          >
            {minutesList.map((val, idx) => {
              const distance = Math.abs(idx - currentMinutesInt);
              const isSelected = idx === currentMinutesInt;

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChangeMinutes(val)}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                  className="w-full flex items-center justify-center text-center transition-all duration-150"
                >
                  <span
                    className={`font-mono text-sm transition-all duration-150 ${
                      isSelected
                        ? 'text-white font-black text-base bg-indigo-600 px-3 py-0.5 rounded-lg shadow-md shadow-indigo-500/40 scale-105'
                        : distance === 1
                        ? 'text-slate-200 font-bold opacity-75'
                        : 'text-slate-400 font-medium opacity-40'
                    }`}
                  >
                    {val}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
