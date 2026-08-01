-- ============================================
-- Flow State Todo List — Initial Migration Schema v5 (Hardened Security)
-- ============================================

-- 1. BẢNG PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 100),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "select_own_profile" on profiles;
create policy "select_own_profile"
  on profiles for select using (auth.uid() = id);

drop policy if exists "update_own_profile" on profiles;
create policy "update_own_profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger tự tạo profile với search_path an toàn & thu hồi quyền execute từ public
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Thu hồi quyền gọi rpc từ public API đối với SECURITY DEFINER function
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. BẢNG TODOS
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null
    check (char_length(title) > 0)
    check (char_length(title) <= 500),
  description text
    check (char_length(description) <= 5000),
  is_completed boolean default false,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz default null
);

-- 3. INDEXES
create index if not exists idx_todos_user_id on todos(user_id);
create index if not exists idx_todos_user_completed on todos(user_id, is_completed)
  where deleted_at is null;
create index if not exists idx_todos_user_due_date on todos(user_id, due_date)
  where deleted_at is null;

-- 4. RLS POLICIES (Đầy đủ SELECT, INSERT, UPDATE, DELETE)
alter table todos enable row level security;

drop policy if exists "select_own_todos" on todos;
drop policy if exists "select_own_active_todos" on todos;
create policy "select_own_todos"
  on todos for select
  using (auth.uid() = user_id);

drop policy if exists "insert_own_todos_limited" on todos;
drop policy if exists "insert_own_todos" on todos;
create policy "insert_own_todos"
  on todos for insert
  with check (auth.uid() = user_id);

drop policy if exists "update_own_todos_safe" on todos;
drop policy if exists "update_own_todos" on todos;
create policy "update_own_todos_safe"
  on todos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete_own_todos" on todos;
create policy "delete_own_todos"
  on todos for delete
  using (auth.uid() = user_id);

-- 5. REALTIME PUBLICATION SETUP
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'todos'
  ) then
    alter publication supabase_realtime add table todos;
  end if;
end $$;

-- 6. TRIGGERS (Bảo vệ dữ liệu phía server & search_path cố định)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_todos_updated_at on todos;
create trigger trg_todos_updated_at
  before update on todos
  for each row execute function public.set_updated_at();

-- 7. CLEANUP JOB (Bảo mật search_path & revoke execute)
create or replace function public.purge_old_deleted_todos()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from todos
  where deleted_at is not null
    and deleted_at < now() - interval '30 days';
end;
$$;

revoke execute on function public.purge_old_deleted_todos() from public, anon, authenticated;
