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

  // If it's already a relative path like "user_id/task-123.webp"
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && trimmed.includes('/')) {
    return trimmed.split('?')[0];
  }

  return null;
}

/**
 * Generates a temporary Signed URL (default 3600s / 60 minutes) for task attachment.
 */
export async function getSignedTaskImageUrl(path: string, expiresIn = 3600): Promise<string> {
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
