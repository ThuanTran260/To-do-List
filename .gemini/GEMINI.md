# Context Engineering: Hệ thống Todo List (Google Stitch + Supabase)

> Tài liệu này dùng làm "bộ não" tham chiếu xuyên suốt quá trình build — dán vào Google Stitch, dán vào Claude Code/Cursor, hoặc dùng làm checklist cá nhân đều được.

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

*(Tùy chọn mở rộng sau: bảng `categories`, bảng `profiles` để lưu tên hiển thị/avatar, liên kết 1-1 với `auth.users`.)*

---

## 5. Prompt mẫu để dùng trong Google Stitch

Dán nguyên đoạn dưới vào Stitch để có bộ UI nhất quán, dễ code lại bằng Tailwind:

```
Design a clean, minimal Todo List web app with the following screens:

1. Login screen — email + password fields, "Forgot password" link,
   "Sign up" link, primary CTA button.
2. Sign up screen — email, password, confirm password, terms checkbox.
3. Dashboard — top bar with app name + user avatar/logout, a task input
   bar at top ("Add a new task..." + priority dropdown + due date picker),
   task list below grouped by status (Active / Completed), each task row
   shows: checkbox, title, priority badge (color-coded low/medium/high),
   due date, edit and delete icon buttons.
4. Empty state — friendly illustration + "No tasks yet, add your first one".
5. Edit task modal — title, description, priority, due date, save/cancel.

Style: minimal, rounded corners (12px), soft shadows, primary color
indigo/blue, generous whitespace, mobile-first responsive layout,
support both light and dark mode. Use a consistent 8px spacing scale.
Export as React components with Tailwind CSS classes.
```

Sau khi Stitch xuất code, việc của bạn chỉ là ghép các component đó vào project Next.js và nối dữ liệu với Supabase client — không cần code UI từ đầu.

---

## 6. Cấu trúc thư mục project

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
│   ├── ui/                      # Component từ Stitch (Button, Card, Modal...)
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

`lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## 7. Luồng phát triển từng bước

1. **Thiết kế UI trên Google Stitch** dùng prompt ở mục 5, xuất code React/Tailwind.
2. **Tạo project Supabase** → chạy SQL ở mục 4 trong SQL Editor.
3. **Khởi tạo Next.js**: `npx create-next-app@latest todo-app --typescript --tailwind`
4. **Cài supabase-js**: `npm install @supabase/supabase-js @supabase/ssr`
5. **Setup `.env.local`** với anon key + URL (lấy trong Supabase Dashboard > Settings > API).
6. **Ghép UI từ Stitch** vào `components/`.
7. **Viết auth flow**: signup/login dùng `supabase.auth.signUp()` / `signInWithPassword()`.
8. **Viết CRUD todo**: gọi `supabase.from('todos').select/insert/update/delete()` — RLS tự lo phần phân quyền.
9. **Test bảo mật**: dùng 2 tài khoản khác nhau, xác nhận không xem được dữ liệu chéo nhau.
10. **Deploy Vercel**, nhập env var qua dashboard (không qua code).
11. **Rà lại checklist bảo mật ở mục 3.5** trước khi share công khai.

---

## 8. Gợi ý mở rộng sau khi có bản MVP

- Realtime sync giữa các thiết bị: `supabase.channel().on('postgres_changes', ...)`
- Offline-first bằng cách cache local (IndexedDB) rồi sync khi có mạng
- Thông báo nhắc deadline qua Supabase Edge Function + cron job
- Đăng nhập bằng Google/GitHub OAuth (Supabase hỗ trợ sẵn, chỉ cần bật trong dashboard)

---

**Tóm lại điều quan trọng nhất cần nhớ:** anon key được phép lộ ra frontend vì RLS sẽ chặn truy cập trái phép ở tầng database; còn service_role key và mọi thứ liên quan đến xử lý mật khẩu thì tuyệt đối chỉ nằm phía server và không bao giờ commit vào Git.