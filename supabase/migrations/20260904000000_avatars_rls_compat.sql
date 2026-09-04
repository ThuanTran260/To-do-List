-- ==============================================================================
-- Migration: 20260904000000_avatars_rls_compat.sql
-- Purpose: Support both folder-based ({userId}/*) and legacy root (avatar-{userId}-*) formats
--          for avatars bucket SELECT, UPDATE, DELETE policies.
-- ==============================================================================

-- 1. Update SELECT policy to support both folder format and legacy root format
DROP POLICY IF EXISTS "select_own_avatars" ON storage.objects;
CREATE POLICY "select_own_avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR name LIKE 'avatar-' || auth.uid()::text || '-%'
  )
);

-- 2. Update UPDATE policy to support both formats
DROP POLICY IF EXISTS "update_own_avatars" ON storage.objects;
CREATE POLICY "update_own_avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR name LIKE 'avatar-' || auth.uid()::text || '-%'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR name LIKE 'avatar-' || auth.uid()::text || '-%'
  )
);

-- 3. Update DELETE policy to support both formats
DROP POLICY IF EXISTS "delete_own_avatars" ON storage.objects;
CREATE POLICY "delete_own_avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR name LIKE 'avatar-' || auth.uid()::text || '-%'
  )
);
