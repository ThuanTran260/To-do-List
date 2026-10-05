-- Migration: codify event trigger ensure_rls + function rls_auto_enable về git
--
-- Production đã có (viết tay qua SQL Editor, không có trong git):
--   evtname=ensure_rls, evtevent=ddl_command_end, evtenabled=O (đang bật).
-- Định nghĩa copy từ pg_get_functiondef(public.rls_auto_enable) đo ngày 2026-10-05.
-- Filter đúng và đủ cho CTAS: command_tag IN
-- ('CREATE TABLE','CREATE TABLE AS','SELECT INTO') — bản đề xuất cũ trong plan
-- chỉ bắt 'CREATE TABLE' là kém hơn.
--
-- Tác dụng: mọi CREATE TABLE (kể cả CTAS) trong schema public tự bật RLS.
-- GIỚI HẠN (đúng thiết kế hiện tại): trigger chỉ ENABLE RLS, KHÔNG REVOKE.
-- Bảng mới vẫn dính default grant (kể cả TRUNCATE) nếu quên REVOKE tường minh —
-- xem 20261005000002. Hai lớp bổ sung nhau, không thay thế nhau.
--
-- Chỉ superuser/postgres tạo được EVENT TRIGGER. Trên production đã tồn tại nên
-- migration này là no-op (guard IF NOT EXISTS); tác dụng thật là cho
-- `supabase db reset` / CI / env mới (hiện fail-open vì thiếu trigger).
-- Idempotent: CREATE OR REPLACE function + guard pg_event_trigger.

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table')
  LOOP
    IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
    END IF;
  END LOOP;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'ensure_rls') THEN
    CREATE EVENT TRIGGER ensure_rls
      ON ddl_command_end
      EXECUTE FUNCTION public.rls_auto_enable();
  END IF;
END $$;
