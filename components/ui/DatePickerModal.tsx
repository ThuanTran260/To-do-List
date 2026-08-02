'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';
import { springPillMotion, popoverMotion, overlayMotion } from '@/lib/motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  RotateCcw,
  X,
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
  // CRITICAL BUG FIX (frontend.md Rule 8 & 29-31):
  // When modal opens, ALWAYS set viewMonth to the month/year of selectedDate (or current date if null).
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() =>
    selectedDate ? new Date(selectedDate) : new Date()
  );
  const [startDate, setStartDate] = useState<Date | null>(selectedDate ? new Date(selectedDate) : null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeShortcut, setActiveShortcut] = useState<ShortcutType>('custom');

  // Time state (Hour 00-23, Minute 00-59) for deadline
  const [endHours, setEndHours] = useState<string>('23');
  const [endMinutes, setEndMinutes] = useState<string>('59');

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
    }
  }, [isOpen, selectedDate]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Next month calculation for dual-month view on desktop
  const nextMonthDate = new Date(year, month + 1, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();

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
    } else if (shortcut === 'yesterday') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      setStartDate(s);
      setEndDate(null);
      setCurrentMonthDate(s);
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

  // Keyboard navigation for presets (Arrow Up/Down, Enter)
  const handlePresetKeyDown = (e: React.KeyboardEvent, index: number, presetsList: ShortcutType[]) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % presetsList.length;
      applyShortcut(presetsList[nextIndex]);
      document.getElementById(`date-preset-${presetsList[nextIndex]}`)?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + presetsList.length) % presetsList.length;
      applyShortcut(presetsList[prevIndex]);
      document.getElementById(`date-preset-${presetsList[prevIndex]}`)?.focus();
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
  };

  const handleApply = () => {
    if (!startDate) return;

    // Use selected date (or end date if range) with specified end hours & minutes
    const targetDate = endDate ? new Date(endDate) : new Date(startDate);
    const hrs = Math.min(23, Math.max(0, parseInt(endHours, 10) || 0));
    const mins = Math.min(59, Math.max(0, parseInt(endMinutes, 10) || 0));

    targetDate.setHours(hrs, mins, 0, 0);

    onApply(targetDate.toISOString());
    onClose();
  };

  // Month grid renderer with WCAG 2.1 AA compliant contrast
  const renderMonthGrid = (targetYear: number, targetMonth: number) => {
    const firstDay = new Date(targetYear, targetMonth, 1).getDay();
    const daysInM = new Date(targetYear, targetMonth + 1, 0).getDate();
    const monthName = new Date(targetYear, targetMonth, 1).toLocaleString('vi-VN', {
      month: 'long',
    });

    return (
      <div className="space-y-3">
        {/* Month Header with Accessible Year Dropdown */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
          <span className="capitalize">
            {monthName}
          </span>
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

        {/* Day Names Header (WCAG AA 4.5:1 contrast) */}
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

  // Formatting date range display bar in vi-VN locale
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
        {/* Value Display Bar (Locale vi-VN) */}
        <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-slate-900/60 border border-indigo-200/60 dark:border-slate-800 text-center">
          <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            <span>{formatHeaderRange()}</span>
          </span>
        </div>

        {/* Main Grid: Left Presets + Right Calendar */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* Left Presets Sidebar / Top Scrollbar on Mobile */}
          <LayoutGroup id="date-preset">
            <div
              role="radiogroup"
              aria-label="Preset Date Ranges"
              className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible w-full md:w-36 space-x-1.5 md:space-x-0 md:space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200/60 dark:border-slate-800/60 pb-3 md:pb-0 md:pr-3 flex-shrink-0 no-scrollbar"
            >
              {presetList.map((shortcut, index) => {
                const isActive = activeShortcut === shortcut.id;
                return (
                  <button
                    key={shortcut.id}
                    id={`date-preset-${shortcut.id}`}
                    role="radio"
                    aria-checked={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => applyShortcut(shortcut.id)}
                    onKeyDown={(e) =>
                      handlePresetKeyDown(
                        e,
                        index,
                        presetList.map((p) => p.id)
                      )
                    }
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

          {/* Right Calendar Container */}
          <div className="flex-1 w-full space-y-4 bg-white/40 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 select-none">
            {/* Navigation Controls */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lịch chọn thời gian
              </span>
              <div className="flex items-center gap-1">
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

            {/* Desktop: Dual Month / Mobile: Single Month */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderMonthGrid(year, month)}
              <div className="hidden md:block">
                {renderMonthGrid(nextYear, nextMonth)}
              </div>
            </div>

            {/* End Time Picker (Hours 00-23, Minutes 00-59) */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">
                Giờ hết hạn (End Time):
              </span>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl font-mono text-indigo-600 dark:text-indigo-400 font-bold border border-slate-200 dark:border-slate-700">
                  <Clock className="w-3.5 h-3.5" />
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={endHours}
                    onChange={(e) => setEndHours(e.target.value.padStart(2, '0'))}
                    className="w-7 text-center bg-transparent border-0 focus:outline-none font-bold"
                  />
                  <span>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={endMinutes}
                    onChange={(e) => setEndMinutes(e.target.value.padStart(2, '0'))}
                    className="w-7 text-center bg-transparent border-0 focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
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
