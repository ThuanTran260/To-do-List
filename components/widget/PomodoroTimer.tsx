'use client';

import { useState } from 'react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { Play, Pause, RotateCcw, Timer, Flame, Coffee, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PomodoroTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const { mode, formattedTime, isActive, toggleTimer, resetTimer } = usePomodoro();

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        title="Mở đồng hồ Pomodoro"
      >
        <Timer className="w-5 h-5 animate-pulse" />
        <span className="font-mono font-extrabold text-xs hidden sm:inline">{formattedTime}</span>
      </button>

      {/* Floating Pomodoro Widget Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className="fixed bottom-20 right-6 z-50 w-72 p-5 rounded-3xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mode === 'focus' ? (
                  <Flame className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Coffee className="w-5 h-5 text-amber-500" />
                )}
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {mode === 'focus' ? 'Phiên Tập Trung' : 'Nghỉ Giải Lao'}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time Display */}
            <div className="text-center py-2">
              <span className="font-mono text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                {formattedTime}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleTimer}
                className={`py-2 px-5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 hover:bg-amber-400'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isActive ? 'Tạm dừng' : 'Bắt đầu'}</span>
              </button>

              <button
                onClick={resetTimer}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                title="Đặt lại"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
