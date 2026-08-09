'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Home, ChevronDown, ChevronUp, Bug } from 'lucide-react';
import Link from 'next/link';
import { log } from '@/lib/logger';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    log('error', `[Root Error Boundary Caught]: ${error.message || 'Unknown Root Error'}`, {
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* System Shield Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Heading & Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Flow State — Hệ Thống Gặp Sự Cố
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Đã xảy ra lỗi không mong muốn ở cấp độ hệ thống. Bạn có thể làm mới hoặc quay lại trang chủ.
          </p>
        </div>

        {/* Error Digest */}
        {error.digest && (
          <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400">
            Digest: <span className="text-slate-200 font-semibold">{error.digest}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại hệ thống</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
          >
            <Home className="w-4 h-4" />
            <span>Trang chủ</span>
          </Link>
        </div>

        {/* Debug Stack Trace for Dev Mode */}
        {isDev && (
          <div className="pt-4 border-t border-slate-800 text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-rose-400">
                <Bug className="w-3.5 h-3.5" />
                Chi tiết kỹ thuật (Dev Mode Only)
              </span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetails && (
              <div className="mt-2 p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-48 border border-slate-800 space-y-2">
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
