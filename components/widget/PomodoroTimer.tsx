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
        className="fixed bottom-6 right-6 z-40 p-3 rounded-xl bg-surface-1 border border-hairline text-ink shadow-lg hover:border-hairline-strong transition-colors flex items-center gap-2 cursor-pointer"
        title="Mở đồng hồ Pomodoro"
      >
        <Timer className="w-4 h-4 text-primary" />
        <span className="font-mono font-medium text-xs hidden sm:inline">{formattedTime}</span>
      </button>

      {/* Floating Pomodoro Widget Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            className="fixed bottom-20 right-6 z-50 w-72 p-4 rounded-xl surface-panel bg-surface-1 border border-hairline shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                {mode === 'focus' ? (
                  <Flame className="w-4 h-4 text-primary" />
                ) : (
                  <Coffee className="w-4 h-4 text-warning" />
                )}
                <span className="font-semibold text-xs text-ink">
                  {mode === 'focus' ? 'Phiên Tập Trung' : 'Nghỉ Giải Lao'}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time Display */}
            <div className="text-center py-2">
              <span className="font-mono text-3xl font-semibold text-primary tracking-tight">
                {formattedTime}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={toggleTimer}
                className={`py-1.5 px-4 rounded-md text-on-primary font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-warning hover:bg-warning/90'
                    : 'bg-primary hover:bg-primary-hover'
                }`}
              >
                {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isActive ? 'Tạm dừng' : 'Bắt đầu'}</span>
              </button>

              <button
                onClick={resetTimer}
                className="p-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-ink text-xs font-medium border border-hairline cursor-pointer"
                title="Đặt lại"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
