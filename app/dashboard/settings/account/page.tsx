'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useSignedAvatarUrl } from '@/hooks/useSignedImageUrl';
import { createClient } from '@/lib/supabase/client';
import { Shield, User, Mail, CheckCircle2, Loader2, Camera, UploadCloud, AlertCircle } from 'lucide-react';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.user_metadata?.avatar_url || ''
  );
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const { displayUrl: displayAvatarUrl } = useSignedAvatarUrl(avatarUrl);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [avatarUrl, displayAvatarUrl]);

  // Sync avatarUrl when user metadata updates (e.g. initial auth load)
  useEffect(() => {
    if (user?.user_metadata?.avatar_url && !avatarUrl) {
      setAvatarUrl(user.user_metadata.avatar_url);
    }
  }, [user?.user_metadata?.avatar_url, avatarUrl]);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side Canvas Image Compression (500x500 WebP, Quality 0.90, crisp on Retina/4K)
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 500;
          canvas.height = 500;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Cannot get canvas context'));

          // Draw crop centered 500x500
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 500, 500);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Compression failed'));
            },
            'image/webp',
            0.9
          );
        };
        img.onerror = () => reject(new Error('Cannot load image file'));
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
    setUploadStatus('Đang nén ảnh sắc nét (500x500 WebP)...');

    try {
      // Step 1: Canvas Compression
      const compressedBlob = await compressImage(file);
      setUploadStatus('Đang tải lên Supabase Storage...');

      if (!user?.id) {
        throw new Error('Vui lòng đăng nhập để tải ảnh đại diện.');
      }

      // Step 2: Upload to Supabase Storage in user's isolated folder
      const supabase = createClient();
      const fileName = `${user.id}/avatar-${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedBlob, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Step 3: Update Auth user metadata with relative storage path
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: fileName },
      });
      if (updateError) throw updateError;

      // Also update profiles table for consistency
      await supabase
        .from('profiles')
        .update({ avatar_url: fileName, avatar_path: fileName })
        .eq('id', user.id);

      setAvatarUrl(fileName);
      setAvatarLoadError(false);
      // Invalidate signed avatar queries across all components (Sidebar, etc.)
      await queryClient.invalidateQueries({ queryKey: ['signed-avatar-url'] });
      setSuccessMsg('Đã thay đổi ảnh đại diện thành công!');
    } catch (err: unknown) {
      // E-H3: message chung, không render raw message.
      console.error('[account] avatar upload failed', {
        code: (err as { code?: string })?.code,
      });
      setErrorMsg('Không thể tải ảnh đại diện lên, vui lòng thử lại.');
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
    } catch (err: unknown) {
      // E-H3: message chung, không render raw message.
      console.error('[account] update failed', {
        code: (err as { code?: string })?.code,
      });
      setErrorMsg('Không thể cập nhật tài khoản, vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-ink flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span>Account Info (Thông tin tài khoản & Avatar)</span>
        </h2>
        <p className="text-xs text-ink-subtle font-normal">
          Quản lý ảnh đại diện, tên hiển thị và thông tin cá nhân của bạn.
        </p>
      </div>

      <form
        onSubmit={handleSaveInfo}
        className="p-4 sm:p-6 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-4 shadow-xs"
      >
        {successMsg && (
          <div className="p-2.5 rounded-md bg-success/10 border border-success/20 text-success text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-md bg-danger/10 border border-danger/20 text-danger text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-danger" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* User Avatar Upload Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-hairline">
          <div className="relative group">
            {displayAvatarUrl && !avatarLoadError ? (
              <Image
                src={displayAvatarUrl}
                alt="Avatar"
                width={64}
                height={64}
                unoptimized
                onError={() => setAvatarLoadError(true)}
                className="w-16 h-16 rounded-full object-cover border border-primary-border shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-semibold text-xl shadow-xs">
                {user?.email ? user.email[0].toUpperCase() : 'U'}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 rounded-full bg-overlay text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Đổi Avatar"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-ink text-sm">
              {displayName || 'User Profile'}
            </h3>
            <p className="text-xs text-ink-subtle">{user?.email}</p>
            <div className="flex items-center gap-2 pt-0.5">
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
                className="px-2.5 py-1 rounded-md bg-surface-2 hover:bg-surface-3 text-ink text-xs font-medium border border-hairline flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-primary" />
                )}
                <span>{isUploading ? uploadStatus : 'Tải ảnh mới (Tối đa 10MB)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Display Name Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-primary" />
            <span>Tên hiển thị (Display Name)</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nhập tên hiển thị mới..."
            maxLength={100}
            className="w-full px-3 py-2 text-xs bg-surface-2 border border-hairline rounded-lg focus:outline-none focus:border-primary text-ink transition-colors"
          />
        </div>

        {/* Email Display (Read-Only) */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-ink-muted" />
            <span>Địa chỉ Email</span>
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3 py-2 text-xs bg-surface-2/50 border border-hairline rounded-lg text-ink-muted cursor-not-allowed"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu thay đổi</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
