'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2, ShieldCheck, Zap, Smartphone, ArrowRight, LogOut, User } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background ambient blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            Flow State
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline-flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>{user.email}</span>
              </span>
              <Link
                href="/auth/logout"
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-3xl mx-auto my-auto text-center space-y-6 z-10 py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>Bảo mật Supabase RLS & Đồng bộ Realtime</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          Làm chủ thời gian.{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
            Đạt trạng thái Flow State.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Ứng dụng Todo List thế hệ mới — thiết kế tối giản, tốc độ phản hồi tối ưu, phân quyền dữ liệu tuyệt đối và khả năng truy cập mượt mà trên mọi thiết bị.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>{user ? `Vào Dashboard (${user.email?.split('@')[0]})` : 'Mở Dashboard'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-4 rounded-2xl glass-panel bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Row Level Security</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Phân quyền 100% tại tầng Postgres Database, chỉ mình bạn có quyền xem và chỉnh sửa dữ liệu.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <Zap className="w-6 h-6 text-violet-500" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Optimistic UI & Realtime</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Phản hồi UI tức thì không độ trễ, tự động đồng bộ thời gian thực giữa điện thoại và máy tính.
            </p>
          </div>

          <div className="p-4 rounded-2xl glass-panel bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <Smartphone className="w-6 h-6 text-purple-500" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Mobile Responsive</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Giao diện tối ưu hoàn hảo cho trình duyệt điện thoại khi deploy lên Vercel.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 z-10">
        Flow State Todo List App — Powered by Next.js & Supabase
      </footer>
    </div>
  );
}
