-- ==============================================================================
-- Migration: 20260831000000_todos_image_path.sql
-- Purpose: Add relative image_path and avatar_path columns and backfill from legacy public URLs.
-- Ordering: Runs BEFORE 20260831000001_storage_private.sql (CR-01).
-- Safe: Uses split_part to strip query parameters (MD-01) without data loss.
-- ==============================================================================

-- 1. Add image_path to todos table
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS image_path text;

-- 2. Backfill existing task attachment paths from image_url
UPDATE public.todos
SET image_path = split_part(substring(image_url from '/task-attachments/(.*)'), '?', 1)
WHERE image_url LIKE '%task-attachments%'
  AND image_path IS NULL;

-- 3. Add avatar_path to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path text;

-- 4. Backfill existing avatar paths from avatar_url
UPDATE public.profiles
SET avatar_path = split_part(substring(avatar_url from '/avatars/(.*)'), '?', 1)
WHERE avatar_url LIKE '%avatars%'
  AND avatar_path IS NULL;
