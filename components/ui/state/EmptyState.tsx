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
    <div className="py-12 px-4 text-center rounded-xl bg-surface-1 border border-dashed border-hairline space-y-3">
      <div className="w-10 h-10 rounded-lg bg-primary-subtle text-primary mx-auto flex items-center justify-center border border-primary-border">
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-xs sm:text-sm font-semibold text-ink">{title}</h3>
        {description && (
          <p className="text-xs text-ink-subtle leading-relaxed font-normal">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
