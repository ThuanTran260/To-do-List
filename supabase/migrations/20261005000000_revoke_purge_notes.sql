-- Migration: revoke public execute on purge_old_deleted_notes()
--
-- Root cause: 20260824000000_notes_schema.sql (dòng 100-115) tạo hàm
-- SECURITY DEFINER nhưng bỏ sót dòng revoke mà bản todos
-- (20260801000000_init_schema.sql:142) đã có.
-- SECURITY DEFINER + EXECUTE cho anon => anon gọi được
-- POST /rest/v1/rpc/purge_old_deleted_notes, bypass RLS,
-- xoá notes trash >30 ngày của MỌI user.
--
-- ĐÃ ĐO trên production 2026-10-05:
-- has_function_privilege('anon','public.purge_old_deleted_notes()','EXECUTE') = true.
-- ĐÃ APPLY tay qua SQL Editor, verify lại = false.
-- File này codify trạng thái đã fix về git để env mới reproduce được.
-- Re-runnable: REVOKE khi đã revoke chỉ WARNING, không lỗi.

REVOKE EXECUTE ON FUNCTION public.purge_old_deleted_notes() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_deleted_notes() TO service_role;
