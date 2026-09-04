'use client';

import { useState } from 'react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { Play, Pause, RotateCcw, Timer, Flame, Coffee, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PomodoroTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const {
    mode,
    focusMinutes,
    setFocusMinutes,
    formattedTime,
    isActive,
    toggleTimer,
    resetTimer,
  } = usePomodoro();

  const presets = [15, 25, 45, 60, 90];

  const handleApplyCustomMinutes = (mins: number) => {
    if (!isNaN(mins) && mins > 0) {
      setFocusMinutes(mins);
    }
    setIsEditing(false);
    setInputVal('');
  };

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
            className="fixed bottom-20 right-6 z-50 w-80 p-4 rounded-xl surface-panel bg-surface-1 border border-hairline shadow-2xl space-y-3"
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
                onClick={() => {
                  setIsOpen(false);
                  setIsEditing(false);
                }}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time Display with Click-to-Edit */}
            <div className="text-center py-1">
              {isEditing && !isActive && mode === 'focus' ? (
                <div className="flex items-center justify-center gap-1.5 py-1">
                  <input
                    type="number"
                    min="1"
                    max="720"
                    autoFocus
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={String(focusMinutes)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyCustomMinutes(parseInt(inputVal, 10));
                      } else if (e.key === 'Escape') {
                        setIsEditing(false);
                      }
                    }}
                    className="w-20 text-center font-mono text-2xl font-bold bg-surface-2 border border-primary-border rounded-md px-2 py-0.5 text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="text-xs text-ink-muted font-medium">phút</span>
                  <button
                    type="button"
                    onClick={() => handleApplyCustomMinutes(parseInt(inputVal, 10))}
                    className="ml-1 px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-medium cursor-pointer"
                  >
                    Lưu
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (!isActive && mode === 'focus') {
                      setInputVal(String(focusMinutes));
                      setIsEditing(true);
                    }
                  }}
                  className={`group inline-flex flex-col items-center justify-center ${
                    !isActive && mode === 'focus' ? 'cursor-pointer' : ''
                  }`}
                  title={!isActive && mode === 'focus' ? 'Bấm để tùy chỉnh số phút' : undefined}
                >
                  <span className="font-mono text-3xl font-semibold text-primary tracking-tight transition-transform group-hover:scale-105">
                    {formattedTime}
                  </span>
                  {!isActive && mode === 'focus' && (
                    <span className="text-[10px] text-ink-subtle opacity-70 group-hover:opacity-100 group-hover:text-primary transition-colors">
                      (Bấm để đổi số phút)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Presets (Only when in focus mode and not running) */}
            {mode === 'focus' && !isActive && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-ink-subtle text-center">
                  Thời lượng nhanh
                </div>
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {presets.map((p) => {
                    const isSelected = focusMinutes === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setFocusMinutes(p);
                          setIsEditing(false);
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-2 border-hairline text-ink hover:border-hairline-strong hover:bg-surface-3'
                        }`}
                      >
                        {p}p
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 pt-1 border-t border-hairline">
              <button
                onClick={toggleTimer}
                className={`py-1.5 px-5 rounded-md text-on-primary font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
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
