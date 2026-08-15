'use client';

import { useState } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { WeekStrip } from './WeekStrip';
import { CalendarDayModal } from './CalendarDayModal';
import type { TodoItemData } from '@/types/todo';

export function CalendarGrid() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayModal, setSelectedDayModal] = useState<{ date: Date; todos: TodoItemData[] } | null>(null);
  const { data } = useTodos(1, 200);
  const todos = data?.todos || [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getTodosForDay = (day: number) => {
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return todos.filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      const dueStr = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`;
      return dueStr === targetDateStr;
    });
  };

  const calendarCells = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="space-y-5">
      {/* 7-Day Strip */}
      <WeekStrip selectedDate={currentDate} onSelectDate={setCurrentDate} />

      <div className="p-4 sm:p-6 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-5 shadow-xs">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-subtle text-primary border border-primary-border">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-ink">
                {monthNames[month]} NĂM {year}
              </h3>
              <p className="text-xs text-ink-subtle font-normal">
                Click vào bất kỳ ngày nào để xem và tạo công việc
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-md border border-hairline hover:bg-surface-2 text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-md border border-hairline hover:bg-surface-2 text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid Days Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-ink-subtle uppercase tracking-wider">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Grid Days Body */}
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-24 rounded-lg bg-surface-2/30" />;
            }

            const dayTodos = getTodosForDay(day);
            const isToday = isCurrentMonth && today.getDate() === day;
            const targetDate = new Date(year, month, day);

            return (
              <div
                key={`day-${day}`}
                onClick={() => setSelectedDayModal({ date: targetDate, todos: dayTodos })}
                className={`h-24 p-2 rounded-lg border flex flex-col justify-between transition-colors overflow-hidden cursor-pointer ${
                  isToday
                    ? 'bg-primary-subtle border-primary-border ring-1 ring-primary/20'
                    : 'bg-surface-2 border-hairline hover:border-hairline-strong'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-ink'
                    }`}
                  >
                    {day}
                  </span>
                  {dayTodos.length > 0 && (
                    <span className="text-[10px] font-medium text-primary bg-primary-subtle px-1.5 py-0.5 rounded border border-primary-border">
                      {dayTodos.length} task
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-14 no-scrollbar">
                  {dayTodos.map((t) => (
                    <div
                      key={t.id}
                      className={`text-[10px] p-1 rounded truncate font-medium flex items-center gap-1 ${
                        t.is_completed
                          ? 'bg-success/10 text-success line-through'
                          : 'bg-surface-1 border border-hairline text-ink'
                      }`}
                      title={t.title}
                    >
                      {t.is_completed && <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" />}
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Modal */}
      {selectedDayModal && (
        <CalendarDayModal
          date={selectedDayModal.date}
          todos={selectedDayModal.todos}
          onClose={() => setSelectedDayModal(null)}
        />
      )}
    </div>
  );
}
