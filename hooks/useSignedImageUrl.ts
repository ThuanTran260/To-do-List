'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { extractPath, getSignedTaskImageUrl, getSignedAvatarUrl, getBatchSignedTaskImageUrls } from '@/lib/storage/signedUrl';

/**
 * Hook to resolve and cache Signed URLs for private Supabase Storage task images (MD-04).
 *
 * Supports Dual-Read:
 * - Can take a relative path ("user_id/task-xxx.webp")
 * - Can take a legacy public URL ("https://.../task-attachments/user_id/task-xxx.webp")
 * - Safe displayUrl: Never leaks internal relative paths to <img src>, prevents 404 race condition.
 * - Caches signed URL for 45 minutes and proactively refetches before 60m expiration.
 */
export function useSignedImageUrl(imageUrlOrPath: string | null | undefined) {
  const path = imageUrlOrPath ? extractPath(imageUrlOrPath) : null;
  const isExternalUrl = Boolean(
    imageUrlOrPath &&
    (imageUrlOrPath.startsWith('http://') ||
     imageUrlOrPath.startsWith('https://') ||
     imageUrlOrPath.startsWith('blob:') ||
     imageUrlOrPath.startsWith('data:')) &&
    !path
  );

  const query = useQuery({
    queryKey: ['signed-url', path],
    queryFn: () => getSignedTaskImageUrl(path!),
    enabled: !!path,
    staleTime: 6 * 24 * 60 * 60 * 1000, // 6 days
    gcTime: 7 * 24 * 60 * 60 * 1000,    // 7 days
    refetchInterval: 6 * 24 * 60 * 60 * 1000, // 6 days (refresh before 7-day URL expiry)
    refetchIntervalInBackground: false,
  });

  const displayUrl = isExternalUrl ? imageUrlOrPath : (query.data || null);

  return {
    ...query,
    displayUrl,
    isExternalUrl,
  };
}

/**
 * Hook to resolve and cache Signed URLs for private Supabase Storage avatars.
 *
 * Supports Dual-Read & OAuth:
 * - External URLs (e.g. Google OAuth lh3.googleusercontent.com) -> displayUrl returns raw URL immediately.
 * - Relative path ("user_id/avatar-xxx.webp" or legacy "avatar-user_id-xxx.webp") -> resolves signed URL.
 * - Legacy public URL ("https://.../avatars/...") -> extracts path and resolves signed URL.
 * - Safe displayUrl: Never leaks raw relative storage paths to <img src>, completely eliminating 404 race condition.
 * - Caches signed URL for 45 minutes and proactively refetches before 60m expiration.
 */
export function useSignedAvatarUrl(avatarUrlOrPath: string | null | undefined) {
  const path = avatarUrlOrPath ? extractPath(avatarUrlOrPath) : null;
  const isExternalUrl = Boolean(
    avatarUrlOrPath &&
    (avatarUrlOrPath.startsWith('http://') ||
     avatarUrlOrPath.startsWith('https://') ||
     avatarUrlOrPath.startsWith('blob:') ||
     avatarUrlOrPath.startsWith('data:')) &&
    !path
  );

  const query = useQuery({
    queryKey: ['signed-avatar-url', path],
    queryFn: () => getSignedAvatarUrl(path!),
    enabled: !!path,
    staleTime: 45 * 60 * 1000, // 45 minutes
    gcTime: 60 * 60 * 1000,    // 60 minutes
    refetchInterval: 45 * 60 * 1000,
    refetchIntervalInBackground: false,
  });

  const displayUrl = isExternalUrl ? avatarUrlOrPath : (query.data || null);

  return {
    ...query,
    displayUrl,
    isExternalUrl,
  };
}

export function useBatchSignedUrls(pathsOrUrls: (string | null | undefined)[]) {
  const queryClient = useQueryClient();

  const validPaths = useMemo(() => {
    const extracted = (pathsOrUrls || [])
      .map(extractPath)
      .filter((p): p is string => Boolean(p));
    return Array.from(new Set(extracted));
  }, [pathsOrUrls]);

  const queryKey = useMemo(() => ['batch-signed-urls', [...validPaths].sort().join(',')], [validPaths]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (validPaths.length === 0) return {};
      const urlMap = await getBatchSignedTaskImageUrls(validPaths);
      // Pre-fill individual query cache for each path so TodoItem reads synchronously
      for (const [path, url] of Object.entries(urlMap)) {
        if (url) {
          queryClient.setQueryData(['signed-url', path], url);
        }
      }
      return urlMap;
    },
    enabled: validPaths.length > 0,
    staleTime: 6 * 24 * 60 * 60 * 1000, // 6 days
    gcTime: 7 * 24 * 60 * 60 * 1000,    // 7 days
    refetchInterval: 6 * 24 * 60 * 60 * 1000, // 6 days (must match staleTime)
    refetchOnWindowFocus: false,
  });
}
