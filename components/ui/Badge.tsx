import type { ReactNode } from 'react';

type Priority = 'low' | 'medium' | 'high';

interface BadgeProps {
  priority?: Priority;
  children?: ReactNode;
  className?: string;
}

export function PriorityBadge({ priority = 'medium', className = '' }: BadgeProps) {
  const styles = {
    low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    high: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  };

  const labels = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${styles[priority]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        priority === 'low' ? 'bg-emerald-500' : priority === 'medium' ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
      }`} />
      {labels[priority]}
    </span>
  );
}
