-- Migration: Tags Unique Constraint, Dedup & Color Backfill (Phase 2)
-- 
-- Chú ý quan trọng:
-- 1. File này phải được thực thi với quyền Database Owner / Service Role (chạy qua `supabase db push` [MANUAL] hoặc SQL Console).
-- 2. Đã bọc trong Transaction (BEGIN ... COMMIT) để rollback hoàn toàn nếu gặp sự cố.
-- 3. Đã tự động tạo các bảng backup snapshot trước khi can thiệp dữ liệu.

-- 0. Tạo bảng Backup snapshot trước khi can thiệp dữ liệu
CREATE TABLE IF NOT EXISTS tags_backup_20260907 AS SELECT * FROM tags;
CREATE TABLE IF NOT EXISTS todo_tags_backup_20260907 AS SELECT * FROM todo_tags;
CREATE TABLE IF NOT EXISTS note_tags_backup_20260907 AS SELECT * FROM note_tags;

BEGIN;

-- 1. Xác định Canonical ID (tie-break created_at ASC, id ASC) & Smart Color
CREATE TEMP TABLE mapping_tags ON COMMIT DROP AS
WITH ranked AS (
  SELECT 
    id,
    user_id,
    lower(name) AS norm_name,
    color,
    ROW_NUMBER() OVER (PARTITION BY user_id, lower(name) ORDER BY created_at ASC, id ASC) AS rn,
    FIRST_VALUE(id) OVER (PARTITION BY user_id, lower(name) ORDER BY created_at ASC, id ASC) AS canonical_id
  FROM tags
),
smart_colors AS (
  SELECT 
    user_id, 
    norm_name,
    COALESCE(
      -- Ưu tiên 1: Màu của chính bản canonical (rn = 1) nếu hợp lệ regex #rrggbb
      MAX(CASE WHEN rn = 1 AND color ~ '^#[0-9a-f]{6}$' THEN color END),
      -- Ưu tiên 2: Màu hợp lệ của bất kỳ bản duplicate nào trong cùng nhóm
      MAX(CASE WHEN color ~ '^#[0-9a-f]{6}$' THEN color END),
      -- Ưu tiên 3: Fallback màu mặc định chuẩn
      '#6366f1'
    ) AS resolved_color
  FROM ranked
  GROUP BY user_id, norm_name
)
SELECT r.id AS original_id, r.canonical_id, r.rn, s.resolved_color
FROM ranked r
JOIN smart_colors s ON r.user_id = s.user_id AND r.norm_name = s.norm_name;

-- 2. Cập nhật màu sắc thông minh cho các bản ghi canonical
UPDATE tags t
SET color = m.resolved_color
FROM mapping_tags m
WHERE t.id = m.canonical_id AND m.rn = 1;

-- 3. Xử lý todo_tags:
-- 3a. Xóa các bản ghi con trùng thừa sao cho mỗi (todo_id, canonical_id) chỉ còn tối đa 1 liên kết
DELETE FROM todo_tags tt
USING mapping_tags m
WHERE tt.tag_id = m.original_id
  AND EXISTS (
    SELECT 1 FROM todo_tags tt2
    JOIN mapping_tags m2 ON tt2.tag_id = m2.original_id
    WHERE tt2.todo_id = tt.todo_id
      AND m2.canonical_id = m.canonical_id
      AND (m2.rn < m.rn OR (m2.rn = m.rn AND m2.original_id < m.original_id))
  );

-- 3b. Remap các liên kết còn lại của bản duplicate sang canonical
UPDATE todo_tags tt
SET tag_id = m.canonical_id
FROM mapping_tags m
WHERE tt.tag_id = m.original_id AND m.rn > 1;

-- 4. Xử lý note_tags:
-- 4a. Xóa các bản ghi con trùng thừa sao cho mỗi (note_id, canonical_id) chỉ còn tối đa 1 liên kết
DELETE FROM note_tags nt
USING mapping_tags m
WHERE nt.tag_id = m.original_id
  AND EXISTS (
    SELECT 1 FROM note_tags nt2
    JOIN mapping_tags m2 ON nt2.tag_id = m2.original_id
    WHERE nt2.note_id = nt.note_id
      AND m2.canonical_id = m.canonical_id
      AND (m2.rn < m.rn OR (m2.rn = m.rn AND m2.original_id < m.original_id))
  );

-- 4b. Remap các liên kết còn lại của bản duplicate sang canonical
UPDATE note_tags nt
SET tag_id = m.canonical_id
FROM mapping_tags m
WHERE nt.tag_id = m.original_id AND m.rn > 1;

-- 5. Xóa các thẻ tag trùng thừa (duplicate tags) khỏi bảng tags
DELETE FROM tags
WHERE id IN (SELECT original_id FROM mapping_tags WHERE rn > 1);

-- 6. Chuẩn hóa toàn bộ màu sắc còn lại về chữ thường và fallback hợp lệ trước khi áp constraint
UPDATE tags 
SET color = lower(color) 
WHERE color IS NOT NULL AND color != lower(color);

UPDATE tags 
SET color = '#6366f1' 
WHERE color IS NULL OR color !~ '^#[0-9a-f]{6}$';

-- 7. Áp đặt ràng buộc NOT NULL và CHECK Regex chặt chẽ cho cột color
ALTER TABLE tags ALTER COLUMN color SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_tags_color_hex'
  ) THEN
    ALTER TABLE tags ADD CONSTRAINT chk_tags_color_hex CHECK (color ~ '^#[0-9a-f]{6}$');
  END IF;
END $$;

-- 8. Tạo Unique Index đảm bảo mỗi user không bao giờ có 2 tag trùng tên (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_id_lower_name ON tags (user_id, lower(name));

COMMIT;
