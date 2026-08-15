'use client';

import { useState } from 'react';
import { useTodos, useCreateTodo } from '@/hooks/useTodos';
import { useDropdownManager } from '@/hooks/useDropdownManager';
import { FloatingPanel } from '@/components/ui/FloatingPanel';
import { useWheelMonthScroll } from '@/hooks/useWheelYearScroll';
import { Calendar, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';

export function CalendarPopover() {
  const { activePanel, togglePanel, closeAll } = useDropdownManager();
  const isOpen = activePanel === 'calendar';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [quickTitle, setQuickTitle] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const { data } = useTodos(1, 100);
  const todos = data?.todos || [];
  const createMutation = useCreateTodo();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Smooth mouse wheel scroll handler to change months smoothly
  const { handleWheel } = useWheelMonthScroll({
    onMonthChange: (deltaMonths: number) => {
      setCurrentDate((prev) => {
        const next = new Date(prev.getFullYear(), prev.getMonth() + deltaMonths, 1);
        return next;
      });
    },
  });

  // Days calculation for Vietnam timezone (Monday as first day)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday=0 indexing
  const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const jumpToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  // Get tasks for a specific day in this month
  const getTasksForDay = (day: number) => {
    return todos.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  // Get highest priority color dot for a day
  const getDayDotColor = (day: number) => {
    const dayTasks = getTasksForDay(day);
    if (dayTasks.length === 0) return null;
    if (dayTasks.some((t) => t.priority === 'high')) return 'bg-danger';
    if (dayTasks.some((t) => t.priority === 'medium')) return 'bg-warning';
    return 'bg-success';
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !selectedDay) return;

    const due = new Date(year, month, selectedDay, 9, 0, 0);
    createMutation.mutate(
      {
        title: quickTitle.trim(),
        due_date: due.toISOString(),
        priority: 'medium',
      },
      {
        onSuccess: () => {
          setQuickTitle('');
          setIsQuickAdding(false);
        },
      }
    );
  };

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="relative">
      <button
        onClick={() => togglePanel('calendar')}
        className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 border border-hairline transition-colors cursor-pointer"
        title="Lịch công việc"
      >
        <Calendar className="w-4 h-4 text-primary" />
      </button>

      <FloatingPanel isOpen={isOpen} onClose={closeAll} className="w-80 p-3.5 space-y-3">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded-md hover:bg-surface-2 text-ink-muted hover:text-ink cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold text-ink">
              Tháng {month + 1}/{year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-md hover:bg-surface-2 text-ink-muted hover:text-ink cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={jumpToday}
            className="px-2 py-0.5 rounded-md bg-primary-subtle text-primary text-[11px] font-medium border border-primary-border cursor-pointer"
          >
            Hôm nay
          </button>
        </div>

        {/* Days of Week Header (T2 - CN) */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-ink-subtle">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Grid with Smooth Mouse Wheel Month Scroll */}
        <div
          onWheel={handleWheel}
          className="grid grid-cols-7 gap-1 text-center text-xs font-medium select-none"
        >
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();
            const isSelected = day === selectedDay;
            const dotColor = getDayDotColor(day);

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`h-7 rounded-md flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary font-semibold shadow-xs'
                    : isToday
                    ? 'bg-primary-subtle text-primary font-semibold border border-primary-border'
                    : 'hover:bg-surface-2 text-ink'
                }`}
              >
                <span>{day}</span>
                {dotColor && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-0.5 ${dotColor}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Details & Quick Add */}
        {selectedDay && (
          <div className="pt-2.5 border-t border-hairline space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                Ngày {selectedDay}/{month + 1} ({selectedDayTasks.length} việc)
              </span>
              <button
                onClick={() => setIsQuickAdding(!isQuickAdding)}
                className="text-[11px] font-medium text-primary hover:text-primary-hover flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm việc</span>
              </button>
            </div>

            {/* Quick Add Form */}
            {isQuickAdding && (
              <form onSubmit={handleQuickAdd} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Tên việc cần làm..."
                  className="flex-1 bg-surface-2 px-2.5 py-1 rounded-md text-xs text-ink placeholder:text-ink-subtle border border-hairline focus:outline-none focus:border-primary-border font-medium"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-2.5 py-1 rounded-md bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Day Tasks List */}
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
              {selectedDayTasks.length === 0 ? (
                <p className="text-[11px] text-ink-subtle italic">Không có công việc nào.</p>
              ) : (
                selectedDayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-1.5 rounded-md bg-surface-2 border border-hairline text-[11px] font-medium text-ink truncate flex items-center justify-between"
                  >
                    <span className="truncate">{t.title}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        t.priority === 'high'
                          ? 'bg-danger'
                          : t.priority === 'medium'
                          ? 'bg-warning'
                          : 'bg-success'
                      }`}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </FloatingPanel>
    </div>
  );
}
