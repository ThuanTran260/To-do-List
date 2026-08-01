'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Shield, User, Mail, CheckCircle2, Loader2, Camera, UploadCloud, AlertCircle } from 'lucide-react';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.user_metadata?.avatar_url || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side Canvas Image Compression (<50KB WebP)
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Cannot get canvas context');

          // Draw crop centered 400x400
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 400, 400);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject('Compression failed');
            },
            'image/webp',
            0.85
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh gốc không được vượt quá 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Đang nén ảnh (400x400)...');

    try {
      // Step 1: Canvas Compression
      const compressedBlob = await compressImage(file);
      setUploadStatus('Đang tải lên Supabase Storage...');

      // Step 2: Upload to Supabase Storage
      const supabase = createClient();
      const fileName = `avatar-${user?.id}-${Date.now()}.webp`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedBlob, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = publicUrlData.publicUrl;

      // Step 3: Update Auth user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl },
      });
      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      setSuccessMsg('Đã thay đổi ảnh đại diện thành công!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tải ảnh đại diện lên');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });
      if (error) throw error;
      setSuccessMsg('Đã cập nhật thông tin tài khoản thành công!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-500" />
          <span>Account Info (Thông tin tài khoản & Avatar)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Quản lý ảnh đại diện, tên hiển thị và thông tin cá nhân của bạn.
        </p>
      </div>

      <form
        onSubmit={handleSaveInfo}
        className="p-6 rounded-3xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xl"
      >
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* User Avatar Upload Header */}
        <div className="flex items-center gap-5 pb-5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-lg shadow-indigo-500/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-indigo-500/25">
                {user?.email ? user.email[0].toUpperCase() : 'U'}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 rounded-full bg-slate-950/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Đổi Avatar"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-1.5 flex-1">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              {displayName || 'User Profile'}
            </h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span>{isUploading ? uploadStatus : 'Tải ảnh mới (<50KB)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Display Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tên hiển thị (Display Name)</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nhập tên hiển thị mới..."
            className="w-full bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Email Field (Readonly) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-500" />
            <span>Địa chỉ Email</span>
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full bg-slate-100/40 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 font-medium cursor-not-allowed"
          />
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </form>
    </div>
  );
}
