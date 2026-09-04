'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg('Email không hợp lệ');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Đi qua /auth/callback để exchange code (tái dùng resolveNextTarget của B9)
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });
    // E-H3: message chung dù email tồn tại hay không
    console.error('[forgot-password]', { code: (error as { code?: string })?.code });
    setMsg('Nếu email tồn tại, liên kết đặt lại đã được gửi. Vui lòng kiểm tra hộp thư.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas text-ink">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 rounded-xl bg-surface-1 border border-hairline space-y-4">
        <h2 className="text-xl font-semibold">Quên mật khẩu</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email của bạn"
          className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-sm"
        />
        {msg && <p className="text-xs text-ink-muted">{msg}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-primary text-on-primary text-sm font-medium cursor-pointer"
        >
          {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
        </button>
        <Link href="/login" className="block text-center text-xs text-ink-muted hover:text-ink">
          Quay lại đăng nhập
        </Link>
      </form>
    </div>
  );
}
