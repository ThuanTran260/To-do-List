import { createClient } from '@/lib/supabase/client';
import { log } from '@/lib/logger';

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
 * Uploads a compressed image blob to Supabase Storage 'task-attachments' bucket
 * Path structure: {user_id}/{filename}
 */
export async function uploadTaskImage(
  file: File,
  userId: string,
  onProgress?: (status: string) => void
): Promise<string> {
  const supabase = createClient();

  onProgress?.('Đang nén ảnh...');
  const compressedBlob = await compressTaskImage(file);

  onProgress?.('Đang tải lên Storage...');
  const filename = `${userId}/task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;

  const { error: uploadError } = await supabase.storage
    .from('task-attachments')
    .upload(filename, compressedBlob, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (uploadError) {
    log('error', 'Storage upload error', { error: uploadError.message });
    throw new Error(`Lỗi tải ảnh lên: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('task-attachments')
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}

/**
 * Safely deletes a task image from Supabase Storage bucket 'task-attachments'
 * if the image URL belongs to Supabase Storage.
 */
export async function deleteTaskImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl || !imageUrl.includes('task-attachments')) return;

  try {
    const supabase = createClient();
    // Extract path after 'task-attachments/'
    const parts = imageUrl.split('/task-attachments/');
    if (parts.length < 2) return;

    const path = parts[1].split('?')[0]; // Remove query params if any
    const { error } = await supabase.storage.from('task-attachments').remove([path]);
    if (error) {
      log('warn', 'Failed to delete task image from storage', { path, error: error.message });
    }
  } catch (err) {
    log('error', 'Error in deleteTaskImage', { error: (err as Error).message });
  }
}
