'use client';

interface LoadingSkeletonProps {
  variant?: 'list' | 'card' | 'text';
  count?: number;
}

export function LoadingSkeleton({ variant = 'list', count = 3 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-surface-2 animate-pulse border border-hairline"
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
            className="h-3.5 rounded bg-surface-2 animate-pulse w-3/4"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-lg bg-surface-2 animate-pulse border border-hairline"
        />
      ))}
    </div>
  );
}
