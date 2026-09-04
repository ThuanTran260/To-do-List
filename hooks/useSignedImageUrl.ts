'use client';

import { useQuery } from '@tanstack/react-query';
import { extractPath, getSignedTaskImageUrl, getSignedAvatarUrl } from '@/lib/storage/signedUrl';

/**
 * Hook to resolve and cache Signed URLs for private Supabase Storage task images (MD-04).
 *
 * Supports Dual-Read:
 * - Can take a relative path ("user_id/task-xxx.webp")
 * - Can take a legacy public URL ("https://.../task-attachments/user_id/task-xxx.webp")
 * - Caches signed URL for 45 minutes and proactively refetches before 60m expiration.
 */
export function useSignedImageUrl(imageUrlOrPath: string | null | undefined) {
  const path = imageUrlOrPath ? extractPath(imageUrlOrPath) : null;

  return useQuery({
    queryKey: ['signed-url', path],
    queryFn: () => getSignedTaskImageUrl(path!),
    enabled: !!path,
    staleTime: 45 * 60 * 1000, // 45 minutes
    gcTime: 60 * 60 * 1000,    // 60 minutes
    refetchInterval: 45 * 60 * 1000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook to resolve and cache Signed URLs for private Supabase Storage avatars.
 *
 * Supports Dual-Read & OAuth:
 * - External URLs (e.g. Google OAuth lh3.googleusercontent.com) -> extractPath returns null, hook is disabled, component renders raw URL.
 * - Relative path ("user_id/avatar-xxx.webp" or legacy "avatar-user_id-xxx.webp") -> resolves signed URL.
 * - Legacy public URL ("https://.../avatars/...") -> extracts path and resolves signed URL.
 * - Caches signed URL for 45 minutes and proactively refetches before 60m expiration.
 */
export function useSignedAvatarUrl(avatarUrlOrPath: string | null | undefined) {
  const path = avatarUrlOrPath ? extractPath(avatarUrlOrPath) : null;

  return useQuery({
    queryKey: ['signed-avatar-url', path],
    queryFn: () => getSignedAvatarUrl(path!),
    enabled: !!path,
    staleTime: 45 * 60 * 1000, // 45 minutes
    gcTime: 60 * 60 * 1000,    // 60 minutes
    refetchInterval: 45 * 60 * 1000,
    refetchIntervalInBackground: false,
  });
}
