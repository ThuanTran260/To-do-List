'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="p-5 rounded-xl bg-danger/10 border border-danger/20 text-center space-y-3">
      <AlertCircle className="w-6 h-6 text-danger mx-auto" />
      <p className="text-xs font-medium text-danger">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-md bg-danger hover:bg-danger/90 text-white text-xs font-medium transition-colors flex items-center gap-1.5 mx-auto cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </button>
      )}
    </div>
  );
}
