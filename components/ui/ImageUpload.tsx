'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, Loader2, AlertCircle } from 'lucide-react';

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
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-ink-muted">
        Ảnh minh họa công việc (Attachment)
      </label>

      {errorMsg && (
        <div className="p-2 rounded-md bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {displayUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-hairline bg-surface-2 group aspect-video sm:aspect-[2/1] max-h-56 flex items-center justify-center">
          {/* eslint-disable-next-html-link */}
          <img
            src={displayUrl}
            alt="Task attachment preview"
            className="w-full h-full object-cover rounded-lg"
          />

          {isUploading && (
            <div className="absolute inset-0 bg-overlay backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-1.5">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs font-medium">{statusText || 'Đang tải ảnh lên...'}</span>
            </div>
          )}

          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-surface-1/90 hover:bg-danger text-ink hover:text-white border border-hairline transition-colors shadow-md cursor-pointer"
              title="Gỡ ảnh"
            >
              <X className="w-3.5 h-3.5" />
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
          className={`p-5 rounded-lg border border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 ${
            dragActive
              ? 'border-primary bg-primary-subtle'
              : 'border-hairline hover:border-hairline-strong bg-surface-2/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleSelect}
            className="hidden"
          />
          <div className="p-2 rounded-lg bg-primary-subtle text-primary border border-primary-border">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-ink">
              Kéo thả ảnh vào đây <span className="text-ink-subtle font-normal">hoặc</span>{' '}
              <span className="text-primary hover:underline">Chọn từ máy</span>
            </p>
            <p className="text-[11px] text-ink-subtle">
              JPG, PNG, WebP (Tối đa 10MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
