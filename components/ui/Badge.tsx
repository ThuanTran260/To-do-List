import type { ReactNode } from 'react';

type Priority = 'low' | 'medium' | 'high';

interface BadgeProps {
  priority?: Priority;
  children?: ReactNode;
  className?: string;
}

export function PriorityBadge({ priority = 'medium', className = '' }: BadgeProps) {
  const styles = {
    low: 'bg-success-subtle text-success border-success-border',
    medium: 'bg-warning-subtle text-warning border-warning-border',
    high: 'bg-danger-subtle text-danger border-danger-border',
  };

  const dotColors = {
    low: 'bg-success',
    medium: 'bg-warning',
    high: 'bg-danger',
  };

  const labels = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${styles[priority]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[priority]}`} />
      {labels[priority]}
    </span>
  );
}
