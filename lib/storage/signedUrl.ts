import { createClient } from '@/lib/supabase/client';

/**
 * Extracts storage object relative path from a legacy public URL or path string.
 * Handles both public URLs and query parameter stripping (MD-01).
 *
 * Example:
 * 'https://xxx.supabase.co/storage/v1/object/public/task-attachments/user1/task-123.webp?token=abc'
 * -> 'user1/task-123.webp'
 */
export function extractPath(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  if (trimmed.includes('/task-attachments/')) {
    const parts = trimmed.split('/task-attachments/');
    if (parts.length >= 2) {
      return parts[1].split('?')[0] || null;
    }
  }

  if (trimmed.includes('/avatars/')) {
    const parts = trimmed.split('/avatars/');
    if (parts.length >= 2) {
      return parts[1].split('?')[0] || null;
    }
  }

  // If it's already a relative path like "user_id/task-123.webp", "user_id/avatar-123.webp", or legacy "avatar-user_id-123.webp"
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    if (trimmed.includes('/') || trimmed.startsWith('avatar-') || trimmed.startsWith('task-')) {
      return trimmed.split('?')[0];
    }
  }

  return null;
}

/**
 * Generates a temporary Signed URL (default 7 days / 604800s) for task attachment.
 */
export async function getSignedTaskImageUrl(path: string, expiresIn = 604800): Promise<string> {
  const supabase = createClient();
  const cleanPath = path.split('?')[0];
  const { data, error } = await supabase.storage
    .from('task-attachments')
    .createSignedUrl(cleanPath, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

/**
 * Generates temporary Signed URLs (default 7 days / 604800s) for a batch of task attachment paths.
 * Differentiates top-level network/auth errors (throws) vs per-item missing objects (returns null).
 */
export async function getBatchSignedTaskImageUrls(
  paths: string[],
  expiresIn = 604800
): Promise<Record<string, string | null>> {
  if (!paths || paths.length === 0) return {};

  const cleanPaths = Array.from(new Set(paths.map((p) => p.split('?')[0]).filter(Boolean)));
  if (cleanPaths.length === 0) return {};

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('task-attachments')
    .createSignedUrls(cleanPaths, expiresIn);

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Không nhận được dữ liệu batch signed URLs');
  }

  const result: Record<string, string | null> = {};
  for (const item of data) {
    if (item.path == null) continue;
    if (item.signedUrl && !item.error) {
      result[item.path] = item.signedUrl;
    } else {
      result[item.path] = null;
    }
  }
  return result;
}

/**
 * Generates a temporary Signed URL (default 3600s / 60 minutes) for avatar.
 */
export async function getSignedAvatarUrl(path: string, expiresIn = 3600): Promise<string> {
  const supabase = createClient();
  const cleanPath = path.split('?')[0];
  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(cleanPath, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
