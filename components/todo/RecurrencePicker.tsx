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
      <label className="text-[11px] font-medium text-ink-subtle uppercase tracking-wider flex items-center gap-1">
        <Repeat className="w-3 h-3 text-primary" />
        <span>Lặp lại (Recurrence)</span>
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-surface-2 px-2.5 py-1.5 rounded-md text-xs text-ink border border-hairline focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium cursor-pointer"
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
