'use client';

import { CheckSquare } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  title: string;
  is_done: boolean;
}

interface ChecklistProgressProps {
  items: ChecklistItem[];
}

export function ChecklistProgress({ items }: ChecklistProgressProps) {
  if (!items || items.length === 0) return null;

  const completed = items.filter((i) => i.is_done).length;
  const total = items.length;
  const percent = Math.round((completed / total) * 100);

  return (
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
      <CheckSquare className="w-3 h-3 text-indigo-500" />
      <span>
        {completed}/{total} ({percent}%)
      </span>
    </div>
  );
}
