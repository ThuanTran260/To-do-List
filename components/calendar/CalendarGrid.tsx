'use client';

import { useState } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="space-y-6">
      {/* 7-Day Strip */}
      <WeekStrip selectedDate={currentDate} onSelectDate={setCurrentDate} />

      <div className="p-6 rounded-3xl glass-panel bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                {monthNames[month]} NĂM {year}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Click vào bất kỳ ngày nào để xem và tạo công việc
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grid Days Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider">
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
              return <div key={`empty-${idx}`} className="h-24 rounded-2xl bg-slate-50/30 dark:bg-slate-800/10" />;
            }

            const dayTodos = getTodosForDay(day);
            const isToday = isCurrentMonth && today.getDate() === day;
            const targetDate = new Date(year, month, day);

            return (
              <motion.div
                key={`day-${day}`}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedDayModal({ date: targetDate, todos: dayTodos })}
                className={`h-24 p-2 rounded-2xl border flex flex-col justify-between transition-all overflow-hidden cursor-pointer ${
                  isToday
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {day}
                  </span>
                  {dayTodos.length > 0 && (
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                      {dayTodos.length} task
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-14 no-scrollbar">
                  {dayTodos.map((t) => (
                    <div
                      key={t.id}
                      className={`text-[10px] p-1 rounded-md truncate font-semibold flex items-center gap-1 ${
                        t.is_completed
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 line-through'
                          : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                      }`}
                      title={t.title}
                    >
                      {t.is_completed && <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" />}
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
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
