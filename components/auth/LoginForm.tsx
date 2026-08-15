'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { loginSchema } from '@/lib/validations/auth';
import { Mail, Lock, Loader2, ArrowRight, CheckCircle2, User, LogOut, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/MotionPage';

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

    // Set remember-me cookie preference (Session Cookie vs 30-day Persistent Cookie)
    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';

    if (rememberMe) {
      document.cookie = `sb-remember-me=true; path=/; max-age=2592000; SameSite=Lax${secureFlag}`;
    } else {
      document.cookie = `sb-remember-me=false; path=/; SameSite=Lax${secureFlag}`;
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
      // Full session refresh redirect
      window.location.href = '/dashboard';
    }
  };

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-md p-6 sm:p-8 rounded-xl surface-panel bg-surface-1 border border-hairline shadow-2xl space-y-5 text-ink"
    >
      <motion.div variants={staggerItemVariants} className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-primary mx-auto flex items-center justify-center text-on-primary shadow-xs">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Đăng nhập Flow State
        </h2>
        <p className="text-xs text-ink-subtle font-normal">
          Quản lý công việc thông minh & bảo mật tuyệt đối
        </p>
      </motion.div>

      {/* Active Session Notice Banner */}
      {user && (
        <motion.div
          variants={staggerItemVariants}
          className="p-3 rounded-lg bg-surface-2 border border-hairline space-y-2"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-ink">
            <User className="w-4 h-4 text-primary" />
            <span>Đang đăng nhập với: <strong>{user.email}</strong></span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/dashboard"
              className="flex-1 py-1.5 px-3 rounded-md bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Vào Dashboard</span>
            </Link>
            <a
              href="/auth/logout"
              className="py-1.5 px-3 rounded-md bg-surface-3 hover:bg-danger/10 text-ink-muted hover:text-danger text-xs font-medium flex items-center justify-center gap-1 transition-colors border border-hairline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </a>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {errorMsg && (
          <motion.div
            variants={staggerItemVariants}
            className="p-2.5 rounded-md bg-danger/10 border border-danger/20 text-danger text-xs font-medium"
          >
            {errorMsg}
          </motion.div>
        )}

        <motion.div variants={staggerItemVariants} className="space-y-1">
          <label className="text-xs font-medium text-ink-muted">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-surface-2 pl-9 pr-3 py-2 rounded-md border border-hairline text-xs sm:text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
            />
          </div>
        </motion.div>

        <motion.div variants={staggerItemVariants} className="space-y-1">
          <label className="text-xs font-medium text-ink-muted">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-surface-2 pl-9 pr-3 py-2 rounded-md border border-hairline text-xs sm:text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
            />
          </div>
        </motion.div>

        {/* Linear Remember Me Control */}
        <motion.div variants={staggerItemVariants} className="pt-0.5">
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={`w-full py-2 px-3 rounded-md border transition-colors flex items-center justify-between text-xs font-medium cursor-pointer select-none ${
              rememberMe
                ? 'bg-primary-subtle border-primary-border text-primary'
                : 'bg-surface-2 border-hairline text-ink-muted hover:bg-surface-3 hover:text-ink'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  rememberMe
                    ? 'bg-primary border-primary text-on-primary'
                    : 'border-hairline bg-surface-1'
                }`}
              >
                {rememberMe && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>Ghi nhớ đăng nhập</span>
            </div>
            {rememberMe && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-subtle text-primary border border-primary-border">
                Đã bật
              </span>
            )}
          </button>
        </motion.div>

        <motion.div variants={staggerItemVariants} className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Đăng nhập</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      </form>

      <motion.div
        variants={staggerItemVariants}
        className="pt-2 text-center text-xs text-ink-subtle border-t border-hairline font-normal"
      >
        Chưa có tài khoản?{' '}
        <Link
          href="/signup"
          className="font-medium text-primary hover:text-primary-hover underline underline-offset-4"
        >
          Đăng ký ngay
        </Link>
      </motion.div>
    </motion.div>
  );
}
