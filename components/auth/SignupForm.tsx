'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { signupSchema } from '@/lib/validations/auth';
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle2, LogOut, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainerVariants, staggerItemVariants } from '@/components/ui/MotionPage';

export function SignupForm() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const result = signupSchema.safeParse({
      email,
      password,
      confirmPassword,
      displayName,
    });

    if (!result.success) {
      setErrorMsg(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Purge any stale session from a previous login before creating a new account.
    await supabase.auth.signOut({ scope: 'local' });
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-'))
        .forEach((key) => localStorage.removeItem(key));
    } catch {}

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      if (data.session) {
        window.location.href = '/dashboard';
      } else {
        setSuccessMsg(
          'Đăng ký thành công! Vui lòng kiểm tra hộp thư email của bạn để xác nhận tài khoản.'
        );
        setLoading(false);
      }
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
          Tạo tài khoản Flow State
        </h2>
        <p className="text-xs text-ink-subtle font-normal">
          Trải nghiệm hệ thống Todo thông minh & đồng bộ tức thì
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

      <form onSubmit={handleSignup} className="space-y-4">
        {errorMsg && (
          <motion.div
            variants={staggerItemVariants}
            className="p-2.5 rounded-md bg-danger/10 border border-danger/20 text-danger text-xs font-medium"
          >
            {errorMsg}
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            variants={staggerItemVariants}
            className="p-2.5 rounded-md bg-success/10 border border-success/20 text-success text-xs font-medium"
          >
            {successMsg}
          </motion.div>
        )}

        <motion.div variants={staggerItemVariants} className="space-y-1">
          <label className="text-xs font-medium text-ink-muted">
            Tên hiển thị
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full bg-surface-2 pl-9 pr-3 py-2 rounded-md border border-hairline text-xs sm:text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
            />
          </div>
        </motion.div>

        <motion.div variants={staggerItemVariants} className="space-y-1">
          <label className="text-xs font-medium text-ink-muted">
            Email <span className="text-danger">*</span>
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
            Mật khẩu <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              required
              className="w-full bg-surface-2 pl-9 pr-3 py-2 rounded-md border border-hairline text-xs sm:text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
            />
          </div>
        </motion.div>

        <motion.div variants={staggerItemVariants} className="space-y-1">
          <label className="text-xs font-medium text-ink-muted">
            Xác nhận mật khẩu <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              className="w-full bg-surface-2 pl-9 pr-3 py-2 rounded-md border border-hairline text-xs sm:text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
            />
          </div>
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
                <span>Đăng ký tài khoản</span>
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
        Đã có tài khoản?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary-hover underline underline-offset-4"
        >
          Đăng nhập ngay
        </Link>
      </motion.div>
    </motion.div>
  );
}
