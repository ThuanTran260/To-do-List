'use client';

import { Repeat } from 'lucide-react';

interface RecurrencePickerProps {
  value: string | null;
  onChange: (rruleString: string | null) => void;
}

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const options = [
    { label: 'Không lặp lại', value: '' },
    { label: 'Hàng ngày', value: 'FREQ=DAILY' },
    { label: 'Hàng tuần', value: 'FREQ=WEEKLY' },
    { label: 'Hàng tháng', value: 'FREQ=MONTHLY' },
  ];

  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        <Repeat className="w-3 h-3 text-indigo-500" />
        <span>Lặp lại công việc (Recurrence)</span>
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-slate-100/80 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
