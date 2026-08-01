'use client';

interface LoadingSkeletonProps {
  variant?: 'list' | 'card' | 'text';
  count?: number;
}

export function LoadingSkeleton({ variant = 'list', count = 3 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-800/50"
          />
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {items.map((_, i) => (
          <div
            key={i}
            className="h-4 rounded-lg bg-slate-200/70 dark:bg-slate-800/50 animate-pulse w-3/4"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-2xl bg-slate-200/70 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-800/50"
        />
      ))}
    </div>
  );
}
