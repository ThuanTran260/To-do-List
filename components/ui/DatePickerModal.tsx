'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useWheelYearScroll } from '@/hooks/useWheelYearScroll';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  RotateCcw,
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
  const initial = selectedDate ? new Date(selectedDate) : new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(initial);
  const [startDate, setStartDate] = useState<Date | null>(selectedDate ? new Date(selectedDate) : null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeShortcut, setActiveShortcut] = useState<ShortcutType>('custom');

  // Time states (00:00 to 23:59)
  const [startHours, setStartHours] = useState<string>(
    selectedDate ? String(new Date(selectedDate).getHours()).padStart(2, '0') : '09'
  );
  const [startMinutes, setStartMinutes] = useState<string>(
    selectedDate ? String(new Date(selectedDate).getMinutes()).padStart(2, '0') : '00'
  );
  const [endHours, setEndHours] = useState<string>('23');
  const [endMinutes, setEndMinutes] = useState<string>('59');

  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      setStartDate(d);
      setCurrentMonthDate(d);
      setStartHours(String(d.getHours()).padStart(2, '0'));
      setStartMinutes(String(d.getMinutes()).padStart(2, '0'));
    }
  }, [selectedDate]);

  // Smooth mouse wheel scroll handler to change years/months smoothly
  const { handleWheel } = useWheelYearScroll({
    onYearChange: (deltaYears) => {
      setCurrentMonthDate((prev) => {
        const next = new Date(prev);
        next.setFullYear(prev.getFullYear() + deltaYears);
        return next;
      });
    },
  });

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Next month calculation for dual-month view
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

  const handleApply = () => {
    if (!startDate) {
      onApply(null);
      onClose();
      return;
    }

    const finalDate = new Date(startDate);
    finalDate.setHours(parseInt(startHours, 10) || 0);
    finalDate.setMinutes(parseInt(startMinutes, 10) || 0);
    finalDate.setSeconds(0);

    onApply(finalDate.toISOString());
    onClose();
  };

  // Month grid helper
  const renderMonthGrid = (targetYear: number, targetMonth: number) => {
    const firstDay = new Date(targetYear, targetMonth, 1).getDay();
    const daysInM = new Date(targetYear, targetMonth + 1, 0).getDate();
    const monthName = new Date(targetYear, targetMonth, 1).toLocaleString('en-US', {
      month: 'short',
    });

    return (
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {monthName} {targetYear}
        </div>

        {/* Day Names Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
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
                className={`h-8 w-full rounded-xl flex items-center justify-center font-semibold transition-all relative ${
                  isStart || isEnd
                    ? 'bg-indigo-600 text-white font-bold shadow-md scale-105 z-10'
                    : isInRange
                    ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold'
                    : isToday
                    ? 'border border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
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

  // Formatting date range header text
  const formatHeaderRange = () => {
    if (startDate && endDate) {
      return `${startDate.getDate()} ${startDate.toLocaleString('en-US', {
        month: 'short',
      })} ${startDate.getFullYear()} - ${endDate.getDate()} ${endDate.toLocaleString('en-US', {
        month: 'short',
      })} ${endDate.getFullYear()}`;
    }
    if (startDate) {
      return `${startDate.getDate()} ${startDate.toLocaleString('en-US', {
        month: 'short',
      })} ${startDate.getFullYear()}`;
    }
    return 'Chưa chọn hạn';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 pt-1">
        {/* Header Display Range */}
        <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-center">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            <span>{formatHeaderRange()}</span>
          </span>
        </div>

        {/* Main Grid: Left Shortcuts + Right Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {/* Left Sidebar Shortcuts */}
          <div className="space-y-1.5 md:col-span-1 border-r border-slate-200/60 dark:border-slate-800/60 pr-3">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7 days' },
              { id: '15days', label: 'Last 15 days' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'custom', label: 'Custom' },
            ].map((shortcut) => {
              const isActive = activeShortcut === shortcut.id;
              return (
                <button
                  key={shortcut.id}
                  onClick={() => applyShortcut(shortcut.id as ShortcutType)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {shortcut.label}
                </button>
              );
            })}

            {/* Left Primary Apply Button */}
            <div className="pt-4">
              <button
                onClick={handleApply}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Apply</span>
              </button>
            </div>
          </div>

          {/* Right Calendar Container with Smooth Wheel Scroll */}
          <div
            onWheel={handleWheel}
            className="md:col-span-3 space-y-4 bg-white/40 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 select-none relative"
          >
            {/* Header Navigation Controls */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <span>Cuộn chuột để đổi năm</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dual Month Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderMonthGrid(year, month)}
              {renderMonthGrid(nextYear, nextMonth)}
            </div>

            {/* Bottom Time Selector Bar (00:00 - 23:59) */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl font-mono text-indigo-600 dark:text-indigo-400 font-bold border border-slate-200/60 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5" />
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={startHours}
                  onChange={(e) => setStartHours(e.target.value.padStart(2, '0'))}
                  className="w-6 text-center bg-transparent border-0 focus:outline-none"
                />
                <span>:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={startMinutes}
                  onChange={(e) => setStartMinutes(e.target.value.padStart(2, '0'))}
                  className="w-6 text-center bg-transparent border-0 focus:outline-none"
                />
              </div>

              <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full relative">
                <div className="absolute inset-y-0 left-0 right-0 bg-indigo-500 rounded-full opacity-60" />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl font-mono text-slate-500 font-bold border border-slate-200/60 dark:border-slate-700">
                <span>{endHours}:{endMinutes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
