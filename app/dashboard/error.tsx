'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Bug } from 'lucide-react';
import Link from 'next/link';
import { log } from '@/lib/logger';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    log('error', `[Dashboard Error Boundary Caught]: ${error.message || 'Unknown Dashboard Error'}`, {
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg glass-panel bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-rose-500/20 shadow-2xl rounded-3xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Error Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Friendly Heading & Message */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Đã xảy ra lỗi tại Dashboard
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Rất tiếc, đã có sự cố ngoài ý muốn trong quá trình tải dữ liệu hoặc hiển thị giao diện này. Bạn có thể thử khôi phục lại trạng thái.
          </p>
        </div>

        {/* Digest Reference ID if present */}
        {error.digest && (
          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-500 dark:text-slate-400">
            Mã lỗi: <span className="text-slate-700 dark:text-slate-300 font-semibold">{error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <Home className="w-4 h-4" />
            <span>Về Bảng Tin</span>
          </Link>
        </div>

        {/* Development-Only Debug Accordion */}
        {isDev && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                <Bug className="w-3.5 h-3.5" />
                Chi tiết kỹ thuật (Chỉ hiển thị ở Dev Mode)
              </span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetails && (
              <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-48 border border-slate-800 space-y-2">
                <p className="text-rose-400 font-semibold">{error.name}: {error.message}</p>
                {error.stack && (
                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap leading-tight">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
