-- Migration: revoke default privileges cho object TƯƠNG LAI (chặn tái diễn)
--
-- ĐO ĐƯỢC trên production 2026-10-05 (pg_default_acl, 6 dòng = 2 grantor x 3 loại):
--   postgres       | r | {postgres=arwdDxtm, anon=arwdDxtm, authenticated=arwdDxtm, service_role=arwdDxtm}
--   postgres       | f | {postgres=X, anon=X, authenticated=X, service_role=X}
--   postgres       | S | {postgres=rwU, anon=rwU, authenticated=rwU, service_role=rwU}
--   supabase_admin | r/f/S | tương tự (grantor supabase_admin)
-- arwdDxtm = full table privileges (Table 5.1/5.2 PG docs), X = EXECUTE.
-- Đây là nguồn gốc finding #2 (hàm mới tự thừa hưởng EXECUTE cho anon).
--
-- ĐÃ APPLY tay 3 dòng FOR ROLE postgres qua SQL Editor, verify anon biến mất
-- khỏi 3 dòng grantor=postgres.
--
-- RESIDUAL ĐÃ CHỐT CHẤP NHẬN: 3 dòng grantor=supabase_admin không đổi được từ
-- SQL Editor (ERROR 42501 permission denied — chỉ supabase_admin/superuser mới
-- đổi được default của chính nó). supabase_admin chỉ tạo object hệ thống lúc
-- provision, không tạo bảng app. Bù bằng: REVOKE tường minh trong mỗi migration
-- mới + event trigger ensure_rls + CI invariant tests/unit/migrationSecurity.test.ts.
--
-- LƯU Ý: ALTER DEFAULT PRIVILEGES chỉ dính object tạo SAU nó, không đụng object
-- đã tồn tại — nên vẫn cần 20261005000000 (functions) + 20261005000001 (tables).
-- Re-runnable: ALTER DEFAULT ... REVOKE lặp lại an toàn.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM public, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
