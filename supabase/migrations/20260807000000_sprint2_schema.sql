-- Sprint 2, 3, 5 Schema Migration for Flow State Todo App

-- 1. Sprint 2A: Subtasks JSONB Column
ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;

-- 2. Sprint 2B: Drag & Drop Sort Order Column
ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_todos_sort_order ON todos(user_id, sort_order)
  WHERE deleted_at IS NULL;

-- 3. Sprint 2C: Tags System
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 50),
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (todo_id, tag_id)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_tags" ON tags FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "select_own_todo_tags" ON todo_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid()));
CREATE POLICY "insert_own_todo_tags" ON todo_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid()));
CREATE POLICY "delete_own_todo_tags" ON todo_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid()));

-- 4. Sprint 3A: Recurring Tasks & Pomodoro
ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recurrence_end TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES todos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pomodoro_count INTEGER DEFAULT 0;

-- 5. Sprint 5C: Task Templates
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) > 0),
  template_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_templates" ON task_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_templates" ON task_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_templates" ON task_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_templates" ON task_templates FOR DELETE USING (auth.uid() = user_id);
