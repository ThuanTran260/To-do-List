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

    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 8 ký tự.');
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-indigo-500" />
          <span>Change Password (Đổi mật khẩu)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cập nhật mật khẩu bảo mật cho tài khoản của bạn.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="p-6 rounded-3xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xl"
      >
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-500">{errorMsg}</p>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Mật khẩu mới</span>
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)..."
            className="w-full bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Xác nhận mật khẩu mới</span>
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới..."
            className="w-full bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Đổi mật khẩu</span>
          </button>
        </div>
      </form>
    </div>
  );
}
