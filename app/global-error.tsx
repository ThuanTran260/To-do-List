'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { log } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log('error', `[Global Root Error]: ${error.message || 'Critical Global Error'}`, {
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-5 bg-[#0f1011] border border-white/10 p-6 sm:p-8 rounded-xl shadow-2xl">
          <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Lỗi hệ thống nghiêm trọng
            </h1>
            <p className="text-xs text-white/60 leading-relaxed font-normal">
              Đã xảy ra lỗi tại tầng gốc của ứng dụng. Vui lòng bấm &quot;Tải lại ứng dụng&quot; để khắc phục.
            </p>
          </div>

          {error.digest && (
            <div className="inline-block px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-white/50">
              Mã lỗi: <span className="text-white/80 font-medium">{error.digest}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="w-full py-2 px-4 rounded-md bg-[#5e6ad2] hover:bg-[#6875e5] active:scale-98 text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải lại ứng dụng</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
