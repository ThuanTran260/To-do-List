-- E-H4: update_own_templates thiếu WITH CHECK cho phép ownership-transfer
-- (PATCH row của mình với {"user_id":"<uuid-nạn-nhân>"} → USING pass, ghi user_id nạn nhân).
DROP POLICY IF EXISTS "update_own_templates" ON task_templates;

CREATE POLICY "update_own_templates"
  ON task_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
