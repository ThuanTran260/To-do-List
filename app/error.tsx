'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Bug } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-canvas text-ink">
      <div className="w-full max-w-lg surface-panel bg-surface-1 border border-hairline shadow-2xl rounded-xl p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Error Icon */}
        <div className="w-12 h-12 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto text-danger">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Friendly Heading & Message */}
        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-ink">
            Đã xảy ra lỗi hệ thống
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto leading-relaxed font-normal">
            Ứng dụng đã gặp sự cố không mong muốn. Dữ liệu của bạn trên Supabase vẫn được bảo vệ an toàn bằng Row Level Security.
          </p>
        </div>

        {/* Digest Reference ID if present */}
        {error.digest && (
          <div className="inline-block px-2.5 py-1 rounded bg-surface-2 border border-hairline text-xs font-mono text-ink-subtle">
            Mã lỗi: <span className="text-ink font-medium">{error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-ink font-medium text-xs transition-colors flex items-center justify-center gap-1.5 border border-hairline"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Về Trang Chủ</span>
          </Link>
        </div>

        {/* Development-Only Debug Accordion */}
        {isDev && (
          <div className="pt-3 border-t border-hairline text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-xs font-medium text-ink-subtle hover:text-ink transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-danger">
                <Bug className="w-3.5 h-3.5" />
                Chi tiết kỹ thuật (Dev Mode)
              </span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDetails && (
              <div className="mt-2 p-3 rounded-lg bg-surface-2 text-ink font-mono text-xs overflow-x-auto max-h-48 border border-hairline space-y-2">
                <p className="text-danger font-medium">{error.name}: {error.message}</p>
                {error.stack && (
                  <pre className="text-[11px] text-ink-subtle whitespace-pre-wrap leading-tight">
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
