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
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-subtle bg-surface-2 px-2 py-0.5 rounded border border-hairline">
      <CheckSquare className="w-3 h-3 text-primary" />
      <span>
        {completed}/{total} ({percent}%)
      </span>
    </div>
  );
}
