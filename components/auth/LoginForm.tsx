'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { loginSchema } from '@/lib/validations/auth';
import { Mail, Lock, Loader2, ArrowRight, CheckCircle2, User, LogOut, LayoutDashboard } from 'lucide-react';

export function LoginForm() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Zod validation
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setErrorMsg(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // If a session exists, purge old session first to prevent account state bleed
    if (user) {
      await supabase.auth.signOut({ scope: 'local' });
    }

    // Set remember-me cookie preference:
    // If rememberMe = true: 30 days cookie max-age
    // If rememberMe = false: deleted / absent (making Supabase cookies session cookies that expire on browser close)
    if (rememberMe) {
      document.cookie = 'sb-remember-me=true; path=/; max-age=2592000; SameSite=Lax';
    } else {
      document.cookie = 'sb-remember-me=false; path=/; max-age=0; SameSite=Lax';
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(
        error.message === 'Invalid login credentials'
          ? 'Email hoặc mật khẩu không chính xác'
          : error.message
      );
      setLoading(false);
    } else {
      // Full session refresh redirect to clear React Query & client memory cache completely
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
          Đăng nhập Flow State
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Quản lý công việc thông minh & bảo mật tuyệt đối
        </p>
      </div>

      {/* Active Session Notice Banner */}
      {user && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <User className="w-4 h-4 text-indigo-500" />
            <span>Đang đăng nhập với: <strong>{user.email}</strong></span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/dashboard"
              className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Vào Dashboard</span>
            </Link>
            <Link
              href="/auth/logout"
              className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Sleek Custom Remember Me Control */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-full py-2.5 px-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs font-semibold cursor-pointer select-none ${
              rememberMe
                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/50 text-indigo-900 dark:text-indigo-200 shadow-sm shadow-indigo-500/10'
                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                  rememberMe
                    ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                    : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-transparent'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="font-bold tracking-tight">Ghi nhớ đăng nhập</span>
            </div>
            {rememberMe && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Đã bật
              </span>
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
        Chưa có tài khoản?{' '}
        <Link
          href="/signup"
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}
