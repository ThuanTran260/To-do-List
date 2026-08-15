'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, ShieldCheck, Zap, Smartphone, ArrowRight, LogOut, User } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 bg-canvas text-ink relative">
      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-xs">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-semibold text-base tracking-tight text-ink">
            Flow State
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-subtle hidden sm:inline-flex items-center gap-1 font-normal">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>{user.email}</span>
              </span>
              <a
                href="/auth/logout"
                className="px-3 py-1.5 rounded-md border border-hairline text-xs font-medium text-danger hover:bg-danger/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </a>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium shadow-xs transition-colors"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-3xl mx-auto my-auto text-center space-y-5 z-10 py-12">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary-subtle border border-primary-border text-primary text-xs font-medium">
          <Zap className="w-3.5 h-3.5" />
          <span>Bảo mật Supabase RLS & Đồng bộ Realtime</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-ink leading-tight">
          Làm chủ thời gian.{' '}
          <span className="text-primary">
            Đạt trạng thái Flow State.
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-ink-muted max-w-xl mx-auto leading-relaxed font-normal">
          Ứng dụng Todo List thế hệ mới — thiết kế tối giản, tốc độ phản hồi tối ưu, phân quyền dữ liệu tuyệt đối và khả năng truy cập mượt mà trên mọi thiết bị.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 group"
          >
            <span>{user ? `Vào Dashboard (${user.email?.split('@')[0]})` : 'Mở Dashboard'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-10 text-left">
          <div className="p-4 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-xs text-ink">Row Level Security</h4>
            <p className="text-[11px] text-ink-subtle leading-relaxed font-normal">
              Phân quyền 100% tại tầng Postgres Database, chỉ mình bạn có quyền xem và chỉnh sửa dữ liệu.
            </p>
          </div>

          <div className="p-4 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-2">
            <Zap className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-xs text-ink">Optimistic UI & Realtime</h4>
            <p className="text-[11px] text-ink-subtle leading-relaxed font-normal">
              Phản hồi UI tức thì không độ trễ, tự động đồng bộ thời gian thực giữa điện thoại và máy tính.
            </p>
          </div>

          <div className="p-4 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-2">
            <Smartphone className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-xs text-ink">Mobile Responsive</h4>
            <p className="text-[11px] text-ink-subtle leading-relaxed font-normal">
              Giao diện tối ưu hoàn hảo cho trình duyệt điện thoại khi deploy lên Vercel.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-[11px] text-ink-subtle z-10 font-normal">
        Flow State Todo List App — Powered by Next.js & Supabase
      </footer>
    </div>
  );
}
