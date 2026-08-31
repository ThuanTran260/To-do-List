import { createClient } from '@/lib/supabase/client';
import { log } from '@/lib/logger';
import { extractPath } from '@/lib/storage/signedUrl';

export { extractPath } from '@/lib/storage/signedUrl';

/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * Output format: image/webp, max dimension: 1200px, quality: 0.82 (target < 300KB)
 */
export async function compressTaskImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Không thể khởi tạo Canvas context'));

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Lỗi nén ảnh'));
          },
          'image/webp',
          0.82
        );
      };
      img.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file'));
  });
}

/**
 * Uploads a compressed image blob to Supabase Storage 'task-attachments' bucket.
 * Path structure: {user_id}/{filename}
 * Returns the storage path (e.g. "userId/task-xxx.webp").
 */
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadTaskImage(
  file: File,
  userId: string,
  onProgress?: (status: string) => void
): Promise<string> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error('Định dạng ảnh không hỗ trợ (chỉ nhận JPEG, PNG, WebP, GIF)');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Ảnh vượt quá 10MB');
  }
  if (!userId || userId.includes('/')) {
    throw new Error('Invalid user id');
  }

  const supabase = createClient();

  onProgress?.('Đang nén ảnh...');
  const compressedBlob = await compressTaskImage(file);

  onProgress?.('Đang tải lên Storage...');
  const filename = `${userId}/task-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;

  const { error: uploadError } = await supabase.storage
    .from('task-attachments')
    .upload(filename, compressedBlob, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (uploadError) {
    log('error', 'Storage upload error', { error: uploadError.message });
    throw new Error(`Lỗi tải ảnh lên: ${uploadError.message}`);
  }

  return filename;
}

/**
 * Safely deletes a task image from Supabase Storage bucket 'task-attachments'.
 * Supports both legacy public URLs and new relative storage paths.
 */
export async function deleteTaskImage(imageUrlOrPath: string | null | undefined): Promise<void> {
  if (!imageUrlOrPath) return;

  try {
    const path = extractPath(imageUrlOrPath);
    if (!path) return;

    const supabase = createClient();
    const { error } = await supabase.storage.from('task-attachments').remove([path]);
    if (error) {
      log('warn', 'Failed to delete task image from storage', { path, error: error.message });
    }
  } catch (err) {
    log('error', 'Error in deleteTaskImage', { error: (err as Error).message });
  }
}
