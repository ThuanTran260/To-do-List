-- ==============================================================================
-- Migration: 20260909000000_todos_image_thumb_path.sql
-- Purpose: Add nullable image_thumb_path column to todos table for fast list thumbnails.
-- Reference: ADR-0001
-- Safe: Additive nullable column, zero locks, zero downtime.
-- ==============================================================================

-- 1. Add image_thumb_path to todos table
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS image_thumb_path text;
