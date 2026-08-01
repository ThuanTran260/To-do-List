'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  value?: string | null;
  onChangeFile: (file: File | null) => void;
  onRemoveExistingImage?: () => void;
  statusText?: string;
  isUploading?: boolean;
}

export function ImageUpload({
  value,
  onChangeFile,
  onRemoveExistingImage,
  statusText,
  isUploading = false,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = localPreviewUrl || value;

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const handleFile = (file: File) => {
    setErrorMsg(null);

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type.toLowerCase())) {
      setErrorMsg('Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WebP.');
      return;
    }

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    // Local preview
    const previewUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(previewUrl);
    onChangeFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    if (confirm('Bạn có chắc muốn bỏ ảnh này?')) {
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(null);
      onChangeFile(null);
      if (onRemoveExistingImage) {
        onRemoveExistingImage();
      }
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
        Upload Image (Ảnh minh họa công việc)
      </label>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {displayUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 dark:bg-slate-900/40 group aspect-video sm:aspect-[2/1] max-h-56 flex items-center justify-center">
          {/* eslint-disable-next-html-link */}
          <img
            src={displayUrl}
            alt="Task attachment preview"
            className="w-full h-full object-cover rounded-2xl transition-transform group-hover:scale-105"
          />

          {isUploading && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs font-bold">{statusText || 'Đang tải ảnh lên...'}</span>
            </div>
          )}

          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-900/70 hover:bg-rose-600 text-white backdrop-blur-md transition-colors shadow-lg"
              title="Gỡ ảnh"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-300 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 bg-slate-50/50 dark:bg-slate-900/20'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleSelect}
            className="hidden"
          />
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Drag & Drop files here <span className="text-slate-400 font-normal">OR</span>{' '}
              <span className="text-indigo-600 dark:text-indigo-400 hover:underline">Browse</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Hỗ trợ JPG, PNG, WebP (Tối đa 10MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
