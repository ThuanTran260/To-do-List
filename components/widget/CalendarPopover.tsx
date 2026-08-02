'use client';

import { useState } from 'react';
import { useTodos, useCreateTodo } from '@/hooks/useTodos';
import { useDropdownManager } from '@/hooks/useDropdownManager';
import { FloatingPanel } from '@/components/ui/FloatingPanel';
import { useWheelYearScroll } from '@/hooks/useWheelYearScroll';
import { Calendar, ChevronLeft, ChevronRight, Plus, Sparkles, Clock, Check } from 'lucide-react';

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

  // Smooth mouse wheel scroll handler to change years smoothly
  const { handleWheel } = useWheelYearScroll({
    onYearChange: (deltaYears) => {
      setCurrentDate((prev) => {
        const next = new Date(prev);
        next.setFullYear(prev.getFullYear() + deltaYears);
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
    if (dayTasks.some((t) => t.priority === 'high')) return 'bg-rose-500';
    if (dayTasks.some((t) => t.priority === 'medium')) return 'bg-amber-500';
    return 'bg-emerald-500';
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
        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition-colors"
        title="Lịch công việc"
      >
        <Calendar className="w-4 h-4 text-indigo-500" />
      </button>

      <FloatingPanel isOpen={isOpen} onClose={closeAll} className="w-80 p-4 space-y-4">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
              Tháng {month + 1}/{year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={jumpToday}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800"
          >
            Hôm nay
          </button>
        </div>

        {/* Days of Week Header (T2 - CN) */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Grid with Smooth Mouse Wheel Scroll */}
        <div
          onWheel={handleWheel}
          className="grid grid-cols-7 gap-1 text-center text-xs font-semibold select-none"
        >
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
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
                className={`h-8 rounded-xl flex flex-col items-center justify-center relative transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-md scale-105'
                    : isToday
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{day}</span>
                {dotColor && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${dotColor}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Details & Quick Add */}
        {selectedDay && (
          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Ngày {selectedDay}/{month + 1} ({selectedDayTasks.length} việc)
              </span>
              <button
                onClick={() => setIsQuickAdding(!isQuickAdding)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
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
                  className="flex-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs focus:outline-none font-medium"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Day Tasks List */}
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
              {selectedDayTasks.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Không có công việc nào.</p>
              ) : (
                selectedDayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-1.5 rounded-lg bg-slate-100/60 dark:bg-slate-800/50 text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate flex items-center justify-between"
                  >
                    <span className="truncate">{t.title}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        t.priority === 'high'
                          ? 'bg-rose-500'
                          : t.priority === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
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
