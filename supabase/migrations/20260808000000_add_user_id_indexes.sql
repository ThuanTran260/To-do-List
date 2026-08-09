-- ============================================
-- Flow State Migration: Database Performance & RLS Indexing
-- Migration File: supabase/migrations/20260808000000_add_user_id_indexes.sql
-- Requirement: R3
-- ============================================

-- 1. B-tree indexes for user_id on user-scoped tables
-- Optimizes RLS policy evaluation (auth.uid() = user_id) and user query filtering.

-- Table: todos (Idempotent check)
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);

-- Table: categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Table: tags
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- Table: task_templates
CREATE INDEX IF NOT EXISTS idx_task_templates_user_id ON task_templates(user_id);

-- 2. Foreign Key indexes for junction table todo_tags
-- Optimizes JOIN performance, CASCADE deletes, tag-filtered queries, and RLS EXISTS evaluations.

-- Foreign key todo_id index on todo_tags
CREATE INDEX IF NOT EXISTS idx_todo_tags_todo_id ON todo_tags(todo_id);

-- Foreign key tag_id index on todo_tags
CREATE INDEX IF NOT EXISTS idx_todo_tags_tag_id ON todo_tags(tag_id);
