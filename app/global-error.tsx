'use client';

import { useEffect } from 'react';
import { log } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log('error', `[Global Layout Error Boundary Caught]: ${error.message || 'Unknown Global Error'}`, {
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <h1 className="text-2xl font-bold text-rose-500">Lỗi Cấu Trúc Giao Diện</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Hệ thống đã gặp lỗi nghiêm trọng ở lớp giao diện chính. Vui lòng nhấn nút dưới đây để thử lại.
          </p>
          {error.digest && (
            <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400">
              Digest: <span className="text-slate-200 font-semibold">{error.digest}</span>
            </div>
          )}
          <div>
            <button
              onClick={() => reset()}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
            >
              Tải lại ứng dụng
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
