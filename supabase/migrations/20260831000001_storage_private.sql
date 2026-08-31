-- ==============================================================================
-- Migration: 20260831000001_storage_private.sql
-- Purpose: Flip storage buckets to private and enforce folder-level RLS.
-- Ordering: Runs AFTER 20260831000000_todos_image_path.sql (CR-01).
-- Security: Drops ALL legacy policies (CR-02 + CR-06) to prevent PERMISSIVE bypass.
-- ==============================================================================

-- 1. Flip storage buckets to private
UPDATE storage.buckets SET public = false WHERE id = 'task-attachments';
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- 2. Drop ALL legacy SELECT, INSERT, and DELETE policies across storage.objects (CR-02 + CR-06)
-- Legacy SELECT
DROP POLICY IF EXISTS "Public Access Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Task Attachments Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Public read task-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;

-- Legacy INSERT / DELETE (CR-06: "Authenticated Upload Attachments" bypasses foldername isolation)
DROP POLICY IF EXISTS "Authenticated Upload Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Task Attachments User Folder Insert" ON storage.objects;
DROP POLICY IF EXISTS "Task Attachments User Folder Delete" ON storage.objects;

-- 3. Private SELECT — Only folder owner can read their objects
CREATE POLICY "select_own_task_attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "select_own_avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Private INSERT — Only folder owner can upload into their folder {user_id}/*
CREATE POLICY "insert_own_task_attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "insert_own_avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Private UPDATE — Required for upsert operations (CR-03)
CREATE POLICY "update_own_task_attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "update_own_avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Private DELETE — Only folder owner can delete their files
CREATE POLICY "delete_own_task_attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "delete_own_avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
