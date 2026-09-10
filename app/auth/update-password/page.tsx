'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { passwordSchema } from '@/lib/validations/auth';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Review fix: fallback khi email template vẫn trỏ thẳng /auth/update-password?code=...
  // (chưa qua /auth/callback) — tự exchange code, không phụ thuộc manual Dashboard.
  // Đọc window.location trực tiếp (client-only) để khỏi cần Suspense boundary.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;
    createClient()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error('[update-password] code exchange failed');
          setMsg('Liên kết không hợp lệ hoặc đã hết hạn — hãy yêu cầu lại.');
        }
        window.history.replaceState(null, '', window.location.pathname);
      })
      .catch(() => {
        setMsg('Liên kết không hợp lệ hoặc đã hết hạn — hãy yêu cầu lại.');
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setMsg('Mật khẩu tối thiểu 8 ký tự');
      return;
    }
    if (password !== confirm) {
      setMsg('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    // Session recovery đã được exchange ở /auth/callback trước khi tới đây
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error('[update-password]', { code: (error as { code?: string })?.code });
      setMsg('Không thể đổi mật khẩu. Liên kết có thể đã hết hạn — hãy yêu cầu lại.');
    } else {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Hard reload required to flush auth cookies and server layout cache
      window.location.href = '/dashboard';
      return;
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-canvas text-ink">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 rounded-xl bg-surface-1 border border-hairline space-y-4">
        <h2 className="text-xl font-semibold">Đặt mật khẩu mới</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
          className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-sm"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Xác nhận mật khẩu"
          className="w-full px-3 py-2 rounded-md bg-surface-2 border border-hairline text-sm"
        />
        {msg && <p className="text-xs text-danger">{msg}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-primary text-on-primary text-sm font-medium cursor-pointer"
        >
          {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
}
