'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="p-6 rounded-2xl glass-panel bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
      <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 mx-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </button>
      )}
    </div>
  );
}
