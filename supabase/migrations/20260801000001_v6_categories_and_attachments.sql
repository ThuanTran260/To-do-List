-- ============================================
-- Flow State Migration v6: Categories, Vital Flag & Storage
-- ============================================

-- 1. BẢNG CATEGORIES (Danh mục công việc / Dự án)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null check (char_length(name) > 0 and char_length(name) <= 100),
  color text default '#6366f1',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table categories enable row level security;

drop policy if exists "select_own_categories" on categories;
create policy "select_own_categories" on categories for select using (auth.uid() = user_id);

drop policy if exists "insert_own_categories" on categories;
create policy "insert_own_categories" on categories for insert with check (auth.uid() = user_id);

drop policy if exists "update_own_categories" on categories;
create policy "update_own_categories" on categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete_own_categories" on categories;
create policy "delete_own_categories" on categories for delete using (auth.uid() = user_id);

-- 2. BỔ SUNG CỘT CHO BẢNG TODOS
alter table todos 
  add column if not exists category_id uuid references categories(id) on delete set null,
  add column if not exists is_vital boolean default false,
  add column if not exists image_url text;

-- Index cho vital tasks & categories
create index if not exists idx_todos_user_vital on todos(user_id, is_vital) where deleted_at is null;
create index if not exists idx_todos_category_id on todos(category_id);

-- 3. SUPABASE STORAGE BUCKET CHO TASK ATTACHMENTS & AVATARS
insert into storage.buckets (id, name, public) 
values ('task-attachments', 'task-attachments', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policies cho storage task-attachments
drop policy if exists "Public Access Attachments" on storage.objects;
create policy "Public Access Attachments" on storage.objects for select using (bucket_id = 'task-attachments' or bucket_id = 'avatars');

drop policy if exists "Authenticated Upload Attachments" on storage.objects;
create policy "Authenticated Upload Attachments" on storage.objects for insert with check (
  (bucket_id = 'task-attachments' or bucket_id = 'avatars') and auth.role() = 'authenticated'
);

drop policy if exists "Owner Delete Attachments" on storage.objects;
create policy "Owner Delete Attachments" on storage.objects for delete using (
  (bucket_id = 'task-attachments' or bucket_id = 'avatars') and auth.role() = 'authenticated'
);
