'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string | null; // ISO string
  onApply: (dateISO: string | null) => void;
  title?: string;
}

type ShortcutType = 'today' | 'yesterday' | '7days' | '15days' | 'lastMonth' | 'custom';

export function DatePickerModal({
  isOpen,
  onClose,
  selectedDate,
  onApply,
  title = 'Cập nhật hạn hoàn thành',
}: DatePickerModalProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() =>
    selectedDate ? new Date(selectedDate) : new Date()
  );
  const [startDate, setStartDate] = useState<Date | null>(selectedDate ? new Date(selectedDate) : null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeShortcut, setActiveShortcut] = useState<ShortcutType>('custom');

  // Apple iOS Time Picker State
  const [endHours, setEndHours] = useState<string>('23');
  const [endMinutes, setEndMinutes] = useState<string>('59');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState<boolean>(false);

  // Sync state whenever modal opens or selectedDate changes
  useEffect(() => {
    if (isOpen) {
      if (selectedDate) {
        const d = new Date(selectedDate);
        setStartDate(d);
        setCurrentMonthDate(d);
        setEndHours(String(d.getHours()).padStart(2, '0'));
        setEndMinutes(String(d.getMinutes()).padStart(2, '0'));
      } else {
        const now = new Date();
        setStartDate(null);
        setEndDate(null);
        setCurrentMonthDate(now);
        setEndHours('23');
        setEndMinutes('59');
      }
      setActiveShortcut('custom');
      setIsTimePickerOpen(false);
    }
  }, [isOpen, selectedDate]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Next month calculation for dual-month view
  const nextMonthDate = new Date(year, month + 1, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();

  // Determine whether to expand to 2 months dynamically
  // Expands if startDate and endDate belong to different months/years, or user manually toggles
  const isMultiMonth = Boolean(
    startDate &&
      endDate &&
      (startDate.getMonth() !== endDate.getMonth() || startDate.getFullYear() !== endDate.getFullYear())
  );

  const [forceDualMonth, setForceDualMonth] = useState(false);
  const showDualMonth = isMultiMonth || forceDualMonth;

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };
  const handleYearSelect = (newYear: number) => {
    setCurrentMonthDate(new Date(newYear, month, 1));
  };

  // Preset Shortcut handlers
  const applyShortcut = (shortcut: ShortcutType) => {
    setActiveShortcut(shortcut);
    const now = new Date();

    if (shortcut === 'today') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      setStartDate(s);
      setEndDate(null);
      setCurrentMonthDate(s);
      setForceDualMonth(false);
    } else if (shortcut === 'yesterday') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      setStartDate(s);
      setEndDate(null);
      setCurrentMonthDate(s);
      setForceDualMonth(false);
    } else if (shortcut === '7days') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      setStartDate(s);
      setEndDate(now);
      setCurrentMonthDate(s);
    } else if (shortcut === '15days') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15);
      setStartDate(s);
      setEndDate(now);
      setCurrentMonthDate(s);
    } else if (shortcut === 'lastMonth') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(s);
      setEndDate(e);
      setCurrentMonthDate(s);
    }
  };

  // Date selection click
  const handleDateClick = (date: Date) => {
    setActiveShortcut('custom');
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (date < startDate) {
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setActiveShortcut('custom');
    setForceDualMonth(false);
  };

  const handleApply = () => {
    if (!startDate) return;

    const targetDate = endDate ? new Date(endDate) : new Date(startDate);
    const hrs = Math.min(23, Math.max(0, parseInt(endHours, 10) || 0));
    const mins = Math.min(59, Math.max(0, parseInt(endMinutes, 10) || 0));

    targetDate.setHours(hrs, mins, 0, 0);

    onApply(targetDate.toISOString());
    onClose();
  };

  // Isolated Wheel Scroll Handler (Prevents parent page scrolling completely)
  const handleCalendarWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    // Do not scroll window body
    if (e.currentTarget) {
      e.currentTarget.scrollTop += e.deltaY * 0.2;
    }
  };

  // Month grid renderer
  const renderMonthGrid = (targetYear: number, targetMonth: number) => {
    const firstDay = new Date(targetYear, targetMonth, 1).getDay();
    const daysInM = new Date(targetYear, targetMonth + 1, 0).getDate();
    const monthName = new Date(targetYear, targetMonth, 1).toLocaleString('vi-VN', {
      month: 'long',
    });

    return (
      <div className="space-y-3 min-w-[240px]">
        {/* Month Header */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
          <span className="capitalize">{monthName}</span>
          <select
            value={targetYear}
            onChange={(e) => handleYearSelect(parseInt(e.target.value, 10))}
            className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none"
          >
            {Array.from({ length: 16 }).map((_, idx) => {
              const y = 2020 + idx;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>

        {/* Day Names Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, idx) => (
            <div key={`${d}-${idx}`}>{d}</div>
          ))}
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}

          {Array.from({ length: daysInM }).map((_, i) => {
            const dayNum = i + 1;
            const current = new Date(targetYear, targetMonth, dayNum);

            const isStart = startDate && current.toDateString() === startDate.toDateString();
            const isEnd = endDate && current.toDateString() === endDate.toDateString();
            const isInRange =
              startDate &&
              endDate &&
              current > startDate &&
              current < endDate;

            const isToday = current.toDateString() === new Date().toDateString();

            return (
              <button
                key={dayNum}
                onClick={() => handleDateClick(current)}
                className={`h-8 w-full rounded-xl flex items-center justify-center font-bold transition-all relative ${
                  isStart || isEnd
                    ? 'bg-indigo-600 text-white font-black shadow-md scale-105 z-10'
                    : isInRange
                    ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold'
                    : isToday
                    ? 'border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span>{dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const formatHeaderRange = () => {
    if (startDate && endDate) {
      const s = startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const e = endDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${s} ➔ ${e}`;
    }
    if (startDate) {
      return startDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return 'Chưa chọn hạn';
  };

  const presetList: { id: ShortcutType; label: string }[] = [
    { id: 'today', label: 'Hôm nay' },
    { id: 'yesterday', label: 'Hôm qua' },
    { id: '7days', label: '7 ngày qua' },
    { id: '15days', label: '15 ngày qua' },
    { id: 'lastMonth', label: 'Tháng trước' },
    { id: 'custom', label: 'Tùy chỉnh' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 pt-1">
        {/* Value Display Bar */}
        <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-slate-900/60 border border-indigo-200/60 dark:border-slate-800 text-center">
          <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            <span>{formatHeaderRange()}</span>
          </span>
        </div>

        {/* Main Grid: Left Presets + Right Calendar */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* Left Presets Sidebar */}
          <LayoutGroup id="date-preset">
            <div
              role="radiogroup"
              aria-label="Preset Date Ranges"
              className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible w-full md:w-36 space-x-1.5 md:space-x-0 md:space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200/60 dark:border-slate-800/60 pb-3 md:pb-0 md:pr-3 flex-shrink-0 no-scrollbar"
            >
              {presetList.map((shortcut) => {
                const isActive = activeShortcut === shortcut.id;
                return (
                  <button
                    key={shortcut.id}
                    id={`date-preset-${shortcut.id}`}
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => applyShortcut(shortcut.id)}
                    className={`relative w-auto md:w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-300 font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="date-preset-pill"
                        transition={springPillMotion}
                        className="absolute inset-0 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-700 z-0"
                      />
                    )}
                    <span className="relative z-10">{shortcut.label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          {/* Right Calendar Container with Isolated Wheel Scroll & Smooth Layout Extension */}
          <motion.div
            layout
            transition={springPillMotion}
            onWheel={handleCalendarWheel}
            className="flex-1 w-full space-y-4 bg-white/40 dark:bg-slate-900/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 select-none overscroll-contain"
          >
            {/* Header Navigation Controls & Dual-Month Toggle */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Lịch chọn thời gian</span>
                {showDualMonth && (
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black">
                    2 Tháng
                  </span>
                )}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setForceDualMonth(!forceDualMonth)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    showDualMonth
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {showDualMonth ? '1 Tháng' : '2 Tháng'}
                </button>
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Tháng trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Tháng sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dynamic Grid: 1 Month vs 2 Months Layout Animation */}
            <motion.div
              layout
              transition={springPillMotion}
              className={`grid gap-4 ${
                showDualMonth ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {renderMonthGrid(year, month)}

              <AnimatePresence>
                {showDualMonth && (
                  <motion.div
                    key="second-month-grid"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={springPillMotion}
                  >
                    {renderMonthGrid(nextYear, nextMonth)}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Apple iOS Glassmorphic Time Picker Trigger Bar */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs relative">
              <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">
                Giờ hết hạn (End Time):
              </span>

              {/* Apple iOS Style Time Button Trigger (No spinner arrows!) */}
              <button
                type="button"
                onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 px-3.5 py-1.5 rounded-xl font-mono text-indigo-600 dark:text-indigo-300 font-extrabold border border-indigo-200/80 dark:border-indigo-700/80 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{endHours} : {endMinutes}</span>
              </button>

              {/* Apple iOS 3D Glassmorphic Time Wheel Picker Popover */}
              <AnimatePresence>
                {isTimePickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={springPillMotion}
                    className="absolute bottom-12 right-0 z-50 p-4 rounded-3xl glass-panel bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 w-64"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Chọn giờ Apple iOS</span>
                      </span>
                      <button
                        onClick={() => setIsTimePickerOpen(false)}
                        className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-extrabold"
                      >
                        Xác nhận
                      </button>
                    </div>

                    {/* Apple iOS Dual Wheel Columns */}
                    <div className="flex items-center justify-center gap-3 relative h-36 overflow-hidden">
                      {/* Glass Lens Highlight Bar */}
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-9 rounded-xl bg-indigo-500/20 dark:bg-indigo-500/30 border border-indigo-500/40 pointer-events-none z-0" />

                      {/* Hours Wheel */}
                      <div className="w-20 h-full overflow-y-auto no-scrollbar snap-y snap-mandatory space-y-1 py-14 text-center z-10 font-mono">
                        {Array.from({ length: 24 }).map((_, h) => {
                          const val = String(h).padStart(2, '0');
                          const isSel = val === endHours;
                          return (
                            <div
                              key={h}
                              onClick={() => setEndHours(val)}
                              className={`h-8 flex items-center justify-center snap-center text-sm font-bold cursor-pointer transition-all ${
                                isSel
                                  ? 'text-indigo-600 dark:text-indigo-300 scale-110 font-black'
                                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                            >
                              {val}
                            </div>
                          );
                        })}
                      </div>

                      <span className="font-mono text-base font-black text-indigo-500 z-10">:</span>

                      {/* Minutes Wheel */}
                      <div className="w-20 h-full overflow-y-auto no-scrollbar snap-y snap-mandatory space-y-1 py-14 text-center z-10 font-mono">
                        {Array.from({ length: 60 }).map((_, m) => {
                          const val = String(m).padStart(2, '0');
                          const isSel = val === endMinutes;
                          return (
                            <div
                              key={m}
                              onClick={() => setEndMinutes(val)}
                              className={`h-8 flex items-center justify-center snap-center text-sm font-bold cursor-pointer transition-all ${
                                isSel
                                  ? 'text-indigo-600 dark:text-indigo-300 scale-110 font-black'
                                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                            >
                              {val}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Footer Actions: Reset & Apply */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleApply}
              disabled={!startDate}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Áp dụng (Apply)</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
