-- E-M4: todo_tags chỉ check todos.user_id → attacker gắn victim tag_id vào todo của mình.
-- Học theo insert_own_note_tags (2 chiều) và mở rộng CẢ SELECT (chặt hơn mẫu gốc, có chủ ý:
-- chống enumerate tag nạn nhân qua join; legacy cross-owner rows có thể tàng hình
-- khỏi SELECT nhưng vẫn DELETE được).
DROP POLICY IF EXISTS "select_own_todo_tags" ON todo_tags;
DROP POLICY IF EXISTS "insert_own_todo_tags" ON todo_tags;
DROP POLICY IF EXISTS "delete_own_todo_tags" ON todo_tags;

CREATE POLICY "select_own_todo_tags" ON todo_tags FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM tags WHERE tags.id = todo_tags.tag_id AND tags.user_id = auth.uid())
  );

CREATE POLICY "insert_own_todo_tags" ON todo_tags FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM tags WHERE tags.id = todo_tags.tag_id AND tags.user_id = auth.uid())
  );

CREATE POLICY "delete_own_todo_tags" ON todo_tags FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid())
  );
