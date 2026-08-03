# Context Engineering & AI Execution Rules: Flow State (Next.js + Supabase + Superpowers)

> Tài liệu này vừa là "bộ nào" tham chiếu kiến trúc, vừa chứa các QUY TẮC BẮT BUỘC (System Rules) dành cho AI Agent khi làm việc với dự án này.

---

## 0. Quy Tắc Bắt Buộc Sử Dụng Superpowers Skills (Superpowers Mandatory Execution Rules)

AI Agent làm việc trên dự án này **TUYỆT ĐỐI BẮT BUỘC** phải áp dụng bộ quy trình kỹ năng trong thư mục `.agents/skills/superpowers/skills/`:

1. **BẮT BUỘC ÁP DỤNG `systematic-debugging` KHI CÓ LỖI / BUG:**
   - Tuân thủ nghiêm ngặt **The Iron Law**: **KHÔNG BAO GIỜ SỬA CODE KHI CHƯA TÌM RA NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS - RCA)**.
   - Phải phân tích kỹ các yếu tố kiến trúc sâu: Stacking Context (`backdrop-blur`, `will-change`, `transform`), Overflow Clipping, Z-Index Token Hierarchy, Dynamic Viewport Height (`dvh`), và Virtual Keyboard interactions.
   - Ưu tiên các giải pháp bền vững (như React Portal Engine `createPortal`) thay vì vá lỗi bề mặt (như tăng z-index tạm thời).

2. **BẮT BUỘC ÁP DỤNG `verification-before-completion` TRƯỚC KHI KẾT THÚC:**
   - Không được tuyên bố hoàn thành hay báo lỗi đã sửa xong khi chưa chạy kiểm thử thực tế.
   - Phải chạy `npx tsc --noEmit` (đảm bảo 0 lỗi type) và `npm run build` (đảm bảo biên dịch Next.js thành công 100%).

3. **BẮT BUỘC TẠO `implementation_plan.md` CHO CÁC THAY ĐỔI KIẾN TRÚC/UI NẶNG:**
   - Phân tích nguyên nhân, đề xuất giải pháp, dự đoán xung đột và chờ sự phê duyệt của người dùng trước khi tiến hành viết code.

---

## 1. Kiến trúc tổng thể

```
┌─────────────────┐      HTTPS       ┌──────────────────────┐
│  Google Stitch   │ ──export UI──▶  │   Frontend (Next.js)  │
│  (thiết kế UI)   │                  │   TypeScript + Tailwind│
└─────────────────┘                  └──────────┬────────────┘
                                                  │ supabase-js (anon key)
                                                  ▼
                                      ┌──────────────────────┐
                                      │      Supabase          │
                                      │  - Auth (email/pass,   │
                                      │    OAuth)               │
                                      │  - Postgres DB + RLS    │
                                      │  - Edge Functions        │
                                      │    (server-only secrets) │
                                      └──────────────────────┘
```

**Nguyên tắc cốt lõi:** Frontend **không bao giờ** giữ secret thật sự. Mọi quyền truy cập dữ liệu được Supabase kiểm soát bằng **Row Level Security (RLS)**, không phải bằng việc giấu API key.

---

## 2. Tech stack đề xuất

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| UI design | Google Stitch | Xuất HTML/CSS hoặc React component, style Tailwind sẵn |
| Frontend framework | Next.js 14+ (App Router) + TypeScript | Dễ deploy Vercel, hỗ trợ server component để giấu secret khi cần |
| Styling | Tailwind CSS | Khớp với output của Stitch, không cần convert nhiều |
| Backend/Cloud | Supabase (Postgres + Auth + Edge Functions) | Theo đúng yêu cầu của bạn |
| Form & validate | React Hook Form + Zod | Validate input trước khi gửi lên Supabase |
| Hosting | Vercel | Quản lý biến môi trường an toàn, tích hợp Next.js tốt |
| Quản lý state | React Query (TanStack Query) hoặc Supabase Realtime | Đồng bộ dữ liệu, cache, optimistic update |

---

## 3. Kiến trúc bảo mật (phần quan trọng nhất)

### 3.1. Phân loại key của Supabase

| Key | Nơi dùng | Mức độ nhạy cảm |
|---|---|---|
| `anon` / `publishable` key | Frontend (browser) | An toàn để lộ **nếu** RLS bật đúng — nhưng vẫn nên để trong biến môi trường, không hardcode |
| `service_role` key | **CHỈ** server (Edge Function, API route server-side) | **TUYỆT ĐỐI KHÔNG** đưa vào frontend, không commit lên Git, key này bypass toàn bộ RLS |

**Quy tắc vàng:** Nếu code chạy trong trình duyệt (kể cả `"use client"` trong Next.js) → chỉ dùng `anon key`. Nếu cần quyền cao hơn (gửi email, xử lý thanh toán, thao tác admin) → viết Supabase Edge Function hoặc Next.js Route Handler chạy server-side, dùng `service_role` key ở đó.

### 3.2. Mật khẩu người dùng

- **Không tự lưu/hash mật khẩu.** Dùng Supabase Auth — nó tự hash bằng bcrypt và không bao giờ trả plaintext về client.
- Bật trong Supabase Dashboard > Authentication > Policies:
  - Email confirmation bắt buộc
  - "Leaked password protection" (chặn mật khẩu đã bị lộ trong data breach)
  - Rate limiting cho login/signup (chống brute-force)
  - Tùy chọn: MFA (2FA) cho tài khoản
- Không bao giờ log mật khẩu ra console/log file, kể cả khi debug.

### 3.3. Quản lý biến môi trường

```
# .env.local (KHÔNG commit file này)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# CHỈ dùng trong Edge Function / server, KHÔNG có prefix NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

- Thêm `.env*.local` vào `.gitignore` ngay từ commit đầu tiên.
- Trên Vercel: nhập key qua **Project Settings > Environment Variables**, không paste vào code.
- Không bao giờ để key trong: comment, README, log, ảnh chụp màn hình chia sẻ công khai.
- Rotate key ngay nếu nghi ngờ bị lộ (Supabase Dashboard > Settings > API > Reset key).

### 3.4. Row Level Security — lớp bảo vệ dữ liệu thật sự

Mặc định **mọi bảng phải bật RLS**, deny-by-default, chỉ mở đúng quyền cần thiết (xem SQL ở mục 4).

### 3.5. Checklist bảo mật trước khi public

- [ ] RLS bật trên **tất cả** bảng, kể cả bảng tưởng chừng "không nhạy cảm"
- [ ] `service_role` key không xuất hiện ở bất kỳ file nào trong repo (grep thử: `git grep -i service_role`)
- [ ] CORS trong Supabase chỉ cho phép domain thật của bạn (không để `*` khi lên production)
- [ ] HTTPS bắt buộc (Vercel tự làm điều này)
- [ ] Bật email confirmation + leaked password protection
- [ ] Test bằng 2 tài khoản: đăng nhập user A, thử gọi API lấy todo của user B → phải bị từ chối
- [ ] Không log dữ liệu nhạy cảm (email, id) ra console ở production build

---

## 4. Database schema & RLS (Supabase SQL)

```sql
-- Bảng todos
create table todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null check (char_length(title) > 0),
  description text,
  is_completed boolean default false,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bật RLS — bắt buộc
alter table todos enable row level security;

-- Chỉ được xem todo của chính mình
create policy "select_own_todos"
  on todos for select
  using (auth.uid() = user_id);

-- Chỉ được tạo todo gán cho chính mình
create policy "insert_own_todos"
  on todos for insert
  with check (auth.uid() = user_id);

-- Chỉ được sửa todo của chính mình
create policy "update_own_todos"
  on todos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Chỉ được xóa todo của chính mình
create policy "delete_own_todos"
  on todos for delete
  using (auth.uid() = user_id);

-- Tự động cập nhật updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_todos_updated_at
  before update on todos
  for each row execute function set_updated_at();
```

---

## 5. Cấu trúc thư mục project

```
todo-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx
│   ├── api/                     # Route handlers (server-side, nếu cần)
│   └── layout.tsx
├── components/
│   ├── ui/                      # Component UI (PortalPopover, Modal, Button...)
│   └── todo/
│       ├── TodoList.tsx
│       ├── TodoItem.tsx
│       └── TodoForm.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # supabase client (browser, dùng anon key)
│   │   └── server.ts             # supabase client (server, dùng service_role khi cần)
│   └── validations/todo.ts       # Zod schema
├── .env.local                    # KHÔNG commit
├── .gitignore
└── package.json
```