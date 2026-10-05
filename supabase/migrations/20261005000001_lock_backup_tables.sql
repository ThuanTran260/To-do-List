-- Migration: thu hẹp grant cho 3 bảng *_backup_20260907
--
-- ĐO ĐƯỢC trên production 2026-10-05: RLS đã bật (relrowsecurity=true,
-- 0 policy => deny hết, dữ liệu KHÔNG lộ) nhờ event trigger ensure_rls
-- (viết tay ngoài git). Không cần ENABLE RLS ở đây.
--
-- Vấn đề còn lại: pg_default_acl cho anon/authenticated là arwdDxtm
-- (gồm TRUNCATE). TRUNCATE không tôn trọng RLS theo dòng
-- (postgresql.org/docs/current/ddl-rowsecurity.html:
-- "Operations that apply to the whole table, such as TRUNCATE ...,
-- are not subject to row security"), nên anon TRUNCATE được bảng backup
-- dù RLS đang bật. ĐÃ ĐO: anon_truncate = true. ĐÃ APPLY tay, verify false.
--
-- CỐ Ý KHÔNG DROP: 6 dòng dữ liệu (tags=4, todo_tags=2, note_tags=0),
-- giữ làm đường rollback. REVOKE là fix đảo ngược được.
-- service_role có BYPASSRLS nên vẫn rollback được.
-- Re-runnable: REVOKE/GRANT lặp lại chỉ WARNING, không lỗi.

REVOKE ALL ON TABLE public.tags_backup_20260907 FROM anon, authenticated;
REVOKE ALL ON TABLE public.todo_tags_backup_20260907 FROM anon, authenticated;
REVOKE ALL ON TABLE public.note_tags_backup_20260907 FROM anon, authenticated;

GRANT ALL ON TABLE public.tags_backup_20260907 TO service_role;
GRANT ALL ON TABLE public.todo_tags_backup_20260907 TO service_role;
GRANT ALL ON TABLE public.note_tags_backup_20260907 TO service_role;
