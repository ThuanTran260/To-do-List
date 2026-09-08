import { createClient } from '@/lib/supabase/client';
import { log } from '@/lib/logger';
import { extractPath } from '@/lib/storage/signedUrl';

export { extractPath } from '@/lib/storage/signedUrl';

export interface CompressedTaskImages {
  full: Blob;
  thumb: Blob | null;
}

const MAX_PIXELS = 40_000_000; // 40MP canvas-size guard
const FULL_MAX_DIM = 1600;
const THUMB_MAX_DIM = 320;

function drawScaled(
  source: ImageBitmap | HTMLImageElement,
  naturalWidth: number,
  naturalHeight: number,
  maxDim: number
): HTMLCanvasElement {
  let width = naturalWidth;
  let height = naturalHeight;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể khởi tạo Canvas context');

  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Lỗi nén ảnh'));
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Compresses an image file on the client side into dual outputs.
 * Full: max dimension 1600px, WebP q0.85. Thumb: max dimension 320px
 * (aspect ratio preserved), WebP q0.75. Thumb failure is non-fatal
 * (returns `thumb: null` so the full image is preserved).
 */
export async function compressTaskImage(file: File): Promise<CompressedTaskImages> {
  const objectUrl = URL.createObjectURL(file);
  let bitmap: ImageBitmap | null = null;
  try {
    let source: ImageBitmap | HTMLImageElement | null = null;
    let naturalWidth = 0;
    let naturalHeight = 0;

    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(file);
        naturalWidth = bitmap.width;
        naturalHeight = bitmap.height;
        source = bitmap;
      } catch {
        bitmap = null;
        source = null;
      }
    }

    if (!source) {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.src = objectUrl;
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Không thể đọc file ảnh'));
      });
      naturalWidth = img.naturalWidth || img.width;
      naturalHeight = img.naturalHeight || img.height;
      source = img;
    }

    // 40MP canvas-size guard: placed immediately after decode and before any
    // canvas allocation. Caps canvas size, not decode memory — decode-OOM
    // residual on low-end mobile accepted; not full OOM defense.
    if (naturalWidth * naturalHeight > MAX_PIXELS) {
      throw new Error('Ảnh có độ phân giải quá lớn (vượt quá 40MP)');
    }

    const fullCanvas = drawScaled(source, naturalWidth, naturalHeight, FULL_MAX_DIM);
    const full = await canvasToBlob(fullCanvas, 0.85);

    let thumb: Blob | null = null;
    try {
      const thumbCanvas = drawScaled(source, naturalWidth, naturalHeight, THUMB_MAX_DIM);
      thumb = await canvasToBlob(thumbCanvas, 0.75);
    } catch (thumbErr) {
      log('warn', 'Failed to generate task image thumbnail, falling back to full image only', {
        error: (thumbErr as Error).message,
      });
      thumb = null;
    }

    return { full, thumb };
  } finally {
    try {
      bitmap?.close();
    } catch {
      // ignore bitmap cleanup errors
    }
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Uploads a compressed image blob to Supabase Storage 'task-attachments' bucket.
 * Path structure: {user_id}/{filename}
 * Uploads full and thumbnail in parallel; full is mandatory, thumb is optional.
 */
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadTaskImage(
  file: File,
  userId: string,
  onProgress?: (status: string) => void
): Promise<{ image_path: string; image_thumb_path: string | null }> {
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
  const { full, thumb } = await compressTaskImage(file);

  onProgress?.('Đang tải lên Storage...');
  const rid = crypto.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10); // non-secure-context fallback (HTTP LAN dev)
  const baseId = `task-${Date.now()}-${rid}`;
  const fullFilename = `${userId}/${baseId}.webp`;
  const thumbFilename = thumb ? `${userId}/${baseId}-thumb.webp` : null;

  const uploadFull = supabase.storage
    .from('task-attachments')
    .upload(fullFilename, full, { contentType: 'image/webp', upsert: false });

  const uploadThumb = thumb && thumbFilename
    ? supabase.storage
        .from('task-attachments')
        .upload(thumbFilename, thumb, { contentType: 'image/webp', upsert: false })
    : Promise.resolve({ data: null, error: null });
  // NOTE: annotate `uploadThumb` explicitly so the fallback branch carries the same
  // result type as the real upload — do not rely on accidental narrowing when
  // accessing `.value.data` / `.value.error` below.

  const [fullResult, thumbResult] = await Promise.allSettled([uploadFull, uploadThumb]);

  if (fullResult.status === 'rejected' || (fullResult.value && fullResult.value.error)) {
    const errMsg = fullResult.status === 'rejected'
      ? (fullResult.reason as Error).message
      : fullResult.value.error?.message;
    log('error', 'Storage upload error for full image', { error: errMsg });
    // Best-effort cleanup of thumb if it uploaded
    if (thumbResult.status === 'fulfilled' && thumbResult.value.data && thumbFilename) {
      await supabase.storage.from('task-attachments').remove([thumbFilename]);
    }
    throw new Error(`Lỗi tải ảnh lên: ${errMsg}`);
  }

  let finalThumbPath: string | null = null;
  if (thumbResult.status === 'fulfilled' && !thumbResult.value.error && thumbFilename) {
    finalThumbPath = thumbFilename;
  } else {
    log('warn', 'Storage upload warning for thumbnail: falling back to full image only');
  }

  return {
    image_path: fullFilename,
    image_thumb_path: finalThumbPath,
  };
}

/**
 * Safely deletes task images from Supabase Storage bucket 'task-attachments'.
 * Accepts multiple paths (full + thumbnail + legacy URL), deduplicates them,
 * and purges all in a single Storage `remove()` call.
 * Supports both legacy public URLs and new relative storage paths.
 */
export async function deleteTaskImage(...imageUrlOrPaths: (string | null | undefined)[]): Promise<void> {
  if (!imageUrlOrPaths || imageUrlOrPaths.length === 0) return;

  try {
    const rawPaths = imageUrlOrPaths.map(extractPath).filter((p): p is string => Boolean(p));
    const distinctPaths = Array.from(new Set(rawPaths));
    if (distinctPaths.length === 0) return;

    const supabase = createClient();
    const { error } = await supabase.storage.from('task-attachments').remove(distinctPaths);
    if (error) {
      log('warn', 'Failed to delete task images from storage', { paths: distinctPaths, error: error.message });
    }
  } catch (err) {
    log('error', 'Error in deleteTaskImage', { error: (err as Error).message });
  }
}
