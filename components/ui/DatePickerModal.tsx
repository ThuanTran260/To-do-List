'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useWheelMonthScroll } from '@/hooks/useWheelYearScroll';
import { TimeWheelPicker } from '@/components/ui/TimeWheelPicker';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
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
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() =>
    selectedDate ? new Date(selectedDate) : new Date()
  );
  const [startDate, setStartDate] = useState<Date | null>(selectedDate ? new Date(selectedDate) : null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeShortcut, setActiveShortcut] = useState<ShortcutType>('custom');
  const [slideDirection, setSlideDirection] = useState<number>(1);

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
  const isMultiMonth = Boolean(
    startDate &&
      endDate &&
      (startDate.getMonth() !== endDate.getMonth() || startDate.getFullYear() !== endDate.getFullYear())
  );

  const [forceDualMonth, setForceDualMonth] = useState(false);
  const showDualMonth = isMultiMonth || forceDualMonth;

  const changeMonth = (deltaMonths: number) => {
    setSlideDirection(deltaMonths > 0 ? 1 : -1);
    setCurrentMonthDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + deltaMonths, 1);
      return next;
    });
  };

  const { handleWheel: handleMonthScrollWheel } = useWheelMonthScroll({
    onMonthChange: (deltaMonths) => {
      changeMonth(deltaMonths);
    },
  });

  const handlePrevMonth = () => changeMonth(-1);
  const handleNextMonth = () => changeMonth(1);

  const handleYearSelect = (newYear: number) => {
    setSlideDirection(newYear > year ? 1 : -1);
    setCurrentMonthDate(new Date(newYear, month, 1));
  };

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

  const renderMonthGrid = (targetYear: number, targetMonth: number) => {
    const firstDay = new Date(targetYear, targetMonth, 1).getDay();
    const daysInM = new Date(targetYear, targetMonth + 1, 0).getDate();
    const monthName = new Date(targetYear, targetMonth, 1).toLocaleString('vi-VN', {
      month: 'long',
    });

    return (
      <div className="space-y-3 min-w-0 flex-1">
        {/* Month Header */}
        <div className="flex items-center justify-between text-xs font-semibold text-ink">
          <span className="capitalize">{monthName}</span>
          <select
            value={targetYear}
            onChange={(e) => handleYearSelect(parseInt(e.target.value, 10))}
            className="bg-surface-2 px-2 py-0.5 rounded-md text-xs font-medium text-primary border border-hairline cursor-pointer focus:outline-none"
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
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-subtle">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, idx) => (
            <div key={`${d}-${idx}`}>{d}</div>
          ))}
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7" />
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
                className={`h-7 w-full rounded-md flex items-center justify-center font-medium transition-colors relative cursor-pointer ${
                  isStart || isEnd
                    ? 'bg-primary text-on-primary font-semibold shadow-xs z-10'
                    : isInRange
                    ? 'bg-primary-subtle text-primary font-medium'
                    : isToday
                    ? 'border border-primary text-primary font-semibold'
                    : 'hover:bg-surface-2 text-ink'
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth={showDualMonth ? 'max-w-3xl' : 'max-w-xl'}
    >
      <div className="space-y-4 pt-1">
        {/* Value Display Bar */}
        <div className="p-2.5 rounded-lg bg-surface-2 border border-hairline text-center">
          <span className="text-xs font-semibold text-ink flex items-center justify-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-primary" />
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
              className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible w-full md:w-32 space-x-1 md:space-x-0 md:space-y-1 border-b md:border-b-0 md:border-r border-hairline pb-2.5 md:pb-0 md:pr-3 flex-shrink-0 no-scrollbar"
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
                    className={`relative w-auto md:w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-shrink-0 cursor-pointer ${
                      isActive
                        ? 'text-primary font-semibold'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="date-preset-pill"
                        transition={springPillMotion}
                        className="absolute inset-0 rounded-md bg-primary-subtle border border-primary-border z-0"
                      />
                    )}
                    <span className="relative z-10">{shortcut.label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          {/* Right Calendar Container */}
          <motion.div
            layout
            transition={springPillMotion}
            className="flex-1 w-full space-y-3 bg-surface-1 p-3 rounded-lg border border-hairline select-none overflow-hidden"
          >
            {/* Header Navigation Controls & Dual-Month Toggle */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle flex items-center gap-1.5">
                <span>Lịch chọn thời gian</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setForceDualMonth(!forceDualMonth)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                    showDualMonth
                      ? 'bg-primary-subtle text-primary border-primary-border'
                      : 'bg-surface-2 text-ink-muted border-hairline'
                  }`}
                >
                  {showDualMonth ? '1 Tháng' : '2 Tháng'}
                </button>
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded bg-surface-2 hover:bg-surface-3 text-ink transition-colors cursor-pointer"
                  title="Tháng trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded bg-surface-2 hover:bg-surface-3 text-ink transition-colors cursor-pointer"
                  title="Tháng sau"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div onWheel={handleMonthScrollWheel} className="overscroll-contain">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${year}-${month}-${showDualMonth}`}
                  initial={{ opacity: 0, x: slideDirection * 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -slideDirection * 20 }}
                  transition={springPillMotion}
                  className="flex flex-col md:flex-row gap-5 w-full"
                >
                  {renderMonthGrid(year, month)}

                  {showDualMonth && renderMonthGrid(nextYear, nextMonth)}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Time Picker Trigger Bar */}
            <div className="pt-2.5 border-t border-hairline flex items-center justify-between gap-3 text-xs relative">
              <span className="font-medium text-ink-muted text-[11px]">
                Giờ hết hạn (End Time):
              </span>

              <button
                type="button"
                onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                className="flex items-center gap-1.5 bg-surface-2 hover:bg-surface-3 px-3 py-1 rounded-md font-mono text-primary font-semibold border border-hairline transition-colors shadow-xs active:scale-98 cursor-pointer"
              >
                <Clock className="w-3 h-3 text-primary" />
                <span>{endHours} : {endMinutes}</span>
              </button>

              <AnimatePresence>
                {isTimePickerOpen && (
                  <TimeWheelPicker
                    hours={endHours}
                    minutes={endMinutes}
                    onChangeHours={(h) => setEndHours(h)}
                    onChangeMinutes={(m) => setEndMinutes(m)}
                    onConfirm={() => setIsTimePickerOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Footer Actions: Reset & Apply */}
        <div className="flex items-center justify-between pt-3 border-t border-hairline">
          <button
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleApply}
              disabled={!startDate}
              className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Áp dụng</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
