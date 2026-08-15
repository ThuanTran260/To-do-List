'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { KeyRound, CheckCircle2, Loader2, Lock } from 'lucide-react';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setSuccessMsg('Đã đổi mật khẩu thành công!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi thay đổi mật khẩu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-ink flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <span>Change Password (Đổi mật khẩu)</span>
        </h2>
        <p className="text-xs text-ink-subtle font-normal">
          Cập nhật mật khẩu bảo mật cho tài khoản của bạn.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="p-4 sm:p-6 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-4 shadow-xs"
      >
        {successMsg && (
          <div className="p-2.5 rounded-md bg-success/10 border border-success/20 text-success text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-medium text-danger">{errorMsg}</p>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>Mật khẩu mới</span>
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
            className="w-full bg-surface-2 px-3 py-2 rounded-md border border-hairline text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>Xác nhận mật khẩu mới</span>
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới..."
            className="w-full bg-surface-2 px-3 py-2 rounded-md border border-hairline text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Đổi mật khẩu</span>
          </button>
        </div>
      </form>
    </div>
  );
}
