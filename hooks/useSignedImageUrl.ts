'use client';

import { useQuery } from '@tanstack/react-query';
import { extractPath, getSignedTaskImageUrl } from '@/lib/storage/signedUrl';

/**
 * Hook to resolve and cache Signed URLs for private Supabase Storage images (MD-04).
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
