'use client';

import { motion } from 'framer-motion';

interface WeekStripProps {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

export function WeekStrip({ selectedDate, onSelectDate }: WeekStripProps) {
  const get7Days = () => {
    const days: Date[] = [];
    const current = new Date(selectedDate);
    const dayOfWeek = current.getDay(); // 0 is Sunday
    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday start

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = get7Days();
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        const isSelected = d.toDateString() === selectedDate.toDateString();
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        return (
          <button
            key={i}
            onClick={() => onSelectDate(d)}
            className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : isToday
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase">{dayNames[d.getDay()]}</span>
            <span className="text-sm font-bold mt-0.5">{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}
