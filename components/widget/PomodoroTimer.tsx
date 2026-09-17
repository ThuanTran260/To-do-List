'use client';

import { useState, useEffect } from 'react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { Play, Pause, RotateCcw, Timer, Flame, Coffee, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WheelPickerColumn } from '@/components/ui/WheelPickerColumn';

export function PomodoroTimer() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    mode,
    focusMinutes,
    setFocusMinutes,
    breakMinutes,
    secondsLeft,
    formattedTime,
    isActive,
    toggleTimer,
    resetTimer,
  } = usePomodoro();

  const presets = [15, 25, 45, 60, 90];
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isActive) {
      setHasStarted(true);
    }
  }, [isActive]);

  // Reset hasStarted whenever mode transitions (focus <-> break)
  useEffect(() => {
    setHasStarted(false);
  }, [mode]);

  // Auto-clamp guard: ensure values > 120 clamp to 120
  useEffect(() => {
    if (focusMinutes > 120) {
      setFocusMinutes(120);
    }
  }, [focusMinutes, setFocusMinutes]);

  const handleReset = () => {
    setHasStarted(false);
    resetTimer();
  };

  const handlePresetSelect = (mins: number) => {
    setHasStarted(false);
    setFocusMinutes(mins);
  };

  const totalSeconds = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
  const isIdle = mode === 'focus' && !isActive && !hasStarted && secondsLeft === totalSeconds;
  const isPaused = !isActive && (hasStarted || secondsLeft < totalSeconds);

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
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time Display or 3D WheelPicker */}
            {isIdle ? (
              <div className="py-1">
                <div className="relative flex items-center justify-center rounded-lg bg-surface-2 h-[180px] border border-hairline w-full overflow-hidden">
                  {/* Center lens highlight bar */}
                  <div
                    style={{
                      height: '36px',
                      top: '72px',
                    }}
                    className="absolute inset-x-2 rounded-md bg-primary-subtle border border-primary-border pointer-events-none z-0"
                  />
                  <WheelPickerColumn
                    value={focusMinutes}
                    onChange={setFocusMinutes}
                    min={1}
                    max={120}
                    unit="phút"
                    ariaLabel="Thời lượng tập trung"
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex flex-col items-center justify-center">
                  <span className="font-mono text-4xl font-semibold text-primary tracking-tight">
                    {formattedTime}
                  </span>
                  {isPaused && mode === 'focus' && (
                    <span className="text-xs text-ink-subtle mt-1 font-medium">
                      (Tạm dừng)
                    </span>
                  )}
                  {mode === 'break' && (
                    <span className="text-xs text-warning mt-1 font-medium flex items-center gap-1">
                      <Coffee className="w-3.5 h-3.5" />
                      <span>{isPaused ? 'Nghỉ giải lao (Tạm dừng)' : 'Nghỉ ngơi lấy lại năng lượng'}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Quick Presets (Only when in focus mode and isIdle) */}
            {isIdle && (
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
                        onClick={() => handlePresetSelect(p)}
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
                <span>{isActive ? 'Tạm dừng' : isPaused ? 'Tiếp tục' : 'Bắt đầu'}</span>
              </button>

              <button
                onClick={handleReset}
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
