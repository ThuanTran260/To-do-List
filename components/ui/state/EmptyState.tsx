'use client';

import { LucideIcon, CheckCircle2 } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = CheckCircle2,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="py-12 px-4 text-center rounded-2xl glass-panel bg-white/40 dark:bg-slate-900/40 border border-dashed border-slate-300/80 dark:border-slate-800 space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/20 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
