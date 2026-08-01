-- ============================================
-- Flow State Migration v7: Task Images Storage RLS Isolation
-- ============================================

-- Bật RLS cho storage.objects nếu chưa bật
alter table storage.objects enable row level security;

-- 1. BUCKET ISOLATED POLICIES FOR TASK ATTACHMENTS
-- Cho phép mọi người đọc ảnh công việc công khai (cho task card & detail view)
drop policy if exists "Task Attachments Public Read" on storage.objects;
create policy "Task Attachments Public Read" on storage.objects for select
using (bucket_id = 'task-attachments');

-- Chỉ cho phép người dùng đăng nhập upload ảnh vào thư mục cá nhân của họ: {user_id}/*
drop policy if exists "Task Attachments User Folder Insert" on storage.objects;
create policy "Task Attachments User Folder Insert" on storage.objects for insert with check (
  bucket_id = 'task-attachments' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Chỉ cho phép người dùng xóa ảnh trong thư mục cá nhân của chính họ: {user_id}/*
drop policy if exists "Task Attachments User Folder Delete" on storage.objects;
create policy "Task Attachments User Folder Delete" on storage.objects for delete using (
  bucket_id = 'task-attachments' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
