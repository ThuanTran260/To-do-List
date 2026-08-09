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
│   ├── ui/                      # Component UI
│   └── todo/
│       ├── TodoList.tsx
│       ├── TodoItem.tsx
│       └── TodoForm.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # supabase client (browser, dùng anon key)
│   │   └── server.ts             # supabase client (server)
│   └── validations/todo.ts       # Zod schema
├── .env.local                    # KHÔNG commit
├── .gitignore
└── package.json
```

---

## 6. Gợi ý mở rộng sau khi có bản MVP

- Realtime sync giữa các thiết bị: `supabase.channel().on('postgres_changes', ...)`
- Offline-first bằng cách cache local (IndexedDB) rồi sync khi có mạng
- Thông báo nhắc deadline qua Supabase Edge Function + cron job
- Đăng nhập bằng Google/GitHub OAuth (Supabase hỗ trợ sẵn, chỉ cần bật trong dashboard)

---

## 7. 🚀 Phân Tích & Báo Cáo Kế Hoạch Vận Hành Bộ Superpowers Skills (`.agents/skills/superpowers`)

> Bộ Superpowers Skills (nằm tại `.agents/skills/superpowers/skills/`) định hình toàn bộ quy chuẩn thực thi, phân tích lỗi, lập kế hoạch và nghiệm thu dành cho AI Agent trên dự án **Flow State**.

### 7.1. Phân Tích Chi Tiết 14 Superpowers Skills & Bối Cảnh Sử Dụng

| # | Skill Name | Mục đích & Mô tả cốt lõi | Bối cảnh kích hoạt (When to use) | Quy tắc bắt buộc (Iron Rules) |
|---|---|---|---|---|
| 1 | **`systematic-debugging`** | Phân tích nguyên nhân gốc rễ (Root Cause Analysis - RCA) và sửa lỗi hệ thống | Khi gặp bug, crash, lỗi hydration, hay bất kỳ sai lệch hành vi nào | **THE IRON LAW:** KHÔNG BAO GIỜ sửa code khi chưa tìm ra nguyên nhân gốc rễ. |
| 2 | **`verification-before-completion`** | Thẩm định & kiểm thử thực tế trước khi tuyên bố hoàn thành | Trước khi kết thúc turn làm việc hoặc báo cho người dùng là "đã fix/xong" | **BẮT BUỘC:** Phải chạy `npx tsc --noEmit` (0 lỗi type) & `npm run build` (build thành công). |
| 3 | **`writing-plans`** | Thiết lập tài liệu kiến trúc & kế hoạch thực thi chi tiết (`implementation_plan.md`) | Khi thay đổi kiến trúc nặng, refactor lớn, hoặc triển khai tính năng phức tạp | Phân tích rủi ro, open questions và chờ phê duyệt của người dùng trước khi viết code. |
| 4 | **`executing-plans`** | Thực thi theo kế hoạch đã phê duyệt một cách kỷ luật | Ngay sau khi người dùng phê duyệt `implementation_plan.md` | Thực hiện từng step, verify liên tục và dừng lại báo cáo nếu có sai lệch lớn. |
| 5 | **`brainstorming`** | Phân tích ý tưởng, khảo sát các phương án kỹ thuật và đánh giá trade-offs | Đầu nhiệm vụ mới, khi yêu cầu chưa rõ ràng hoặc cần đề xuất giải pháp UI/UX | Đưa ra các lựa chọn cụ thể kèm ưu/nhược điểm thay vì tự áp đặt giải pháp. |
| 6 | **`test-driven-development`** | Viết test case trước khi viết code triển khai (Red ➔ Green ➔ Refactor) | Khi tạo mới các hàm helper, utility, Zod schemas, hay API handlers nhạy cảm | Viết test fail trước ➔ viết code cho test pass ➔ tối ưu code. |
| 7 | **`subagent-driven-development`** | Phân rã nhiệm vụ và ủy quyền cho các AI Subagent chuyên biệt | Các tác vụ phức tạp gồm nhiều pha độc lập (Worker, Reviewer, Auditor) | Mỗi subagent làm đúng phạm vi role, có kiểm tra nghiệm thu độc lập. |
| 8 | **`dispatching-parallel-agents`** | Kích hoạt nhiều subagent chạy song song | Quét bảo mật toàn bộ repo, audit code song song, hoặc tìm kiếm tài liệu lớn | Không block main agent, tự động tổng hợp kết quả khi subagents hoàn thành. |
| 9 | **`requesting-code-review`** | Gửi yêu cầu review code độc lập cho subagent/reviewer | Sau khi hoàn thành một milestone quan trọng hoặc thay đổi cấu trúc bảo mật | Cung cấp diff chi tiết và danh sách file thay đổi cho reviewer. |
| 10 | **`receiving-code-review`** | Tiếp thu và xử lý các phản hồi code review một cách nghiêm túc | Khi nhận phản hồi từ reviewer hoặc góp ý kỹ thuật từ người dùng | Kiểm tra lại lập luận, sửa triệt để các edge cases được chỉ ra. |
| 11 | **`using-git-worktrees`** | Cô lập môi trường phát triển nhánh tính năng bằng Git Worktree | Khi làm việc trên nhiều tính năng độc lập mà không muốn làm dơ working directory | Giữ nhánh `main` luôn sạch và có thể build production bất cứ lúc nào. |
| 12 | **`finishing-a-development-branch`** | Đóng nhánh phát triển, nghiệm thu, merge và dọn dẹp môi trường | Khi tính năng đã hoàn thành 100% và qua kiểm định | Rebase/merge sạch, chạy verification cuối cùng và dọn dẹp worktree/branch. |
| 13 | **`using-superpowers`** | Harness điều phối trung tâm định hướng việc gọi các skills | Khi bắt đầu bất kỳ tác vụ nào để xác định skill phù hợp | Luôn tuân thủ luồng: Brainstorm ➔ Plan ➔ Execute ➔ Verify. |
| 14 | **`writing-skills`** | Cấu trúc, tác giả và kiểm thử các Superpowers Skills mới | Khi cần đóng góp hoặc mở rộng bộ kỹ năng AI cho dự án | Tuân thủ định dạng YAML frontmatter + markdown chuẩn mực. |

---

### 7.2. Kế Hoạch Vận Hành (Execution Plan) Theo Từng Giai Đoạn Dự Án

Để dự án **Flow State** luôn đạt tiêu chuẩn chất lượng cao nhất, AI Agent sẽ vận hành bộ Superpowers theo 4 pha làm việc chuẩn mực:

```
┌────────────────────────────────────────────────────────────────────────┐
│  PHA 1: KHẢO SÁT & ĐỀ XUẤT (Brainstorming & Skill Selection)          │
│  - Kích hoạt `using-superpowers` ➔ Xác định bài toán                   │
│  - Sử dụng `brainstorming` đưa ra phương án & trade-offs               │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHA 2: KẾ HOẠCH & XÁC NHẬN (Writing Plans)                           │
│  - Sử dụng `writing-plans` tạo `implementation_plan.md`                 │
│  - Đặt câu hỏi clarification (nếu có) ➔ Chờ người dùng phê duyệt      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHA 3: THỰC THI & SỬA LỖI (Executing Plans & Systematic Debugging)    │
│  - Sử dụng `executing-plans` hoặc `subagent-driven-development`        │
│  - Nếu có bug: BẮT BUỘC dùng `systematic-debugging` (Iron Law RCA)     │
│  - Áp dụng `test-driven-development` cho các hàm tính toán cốt lõi     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PHA 4: NGHIỆM THU & BẢO VỆ (Verification Before Completion)           │
│  - BẮT BUỘC dùng `verification-before-completion`                      │
│  - Chạy `npx tsc --noEmit` (0 lỗi) & `npm run build` (Build OK 100%)    │
│  - Tạo `walkthrough.md` tổng kết trước khi báo hoàn thành               │
└────────────────────────────────────────────────────────────────────────┘
```

---

**Tóm lại điều quan trọng nhất cần nhớ:** anon key được phép lộ ra frontend vì RLS sẽ chặn truy cập trái phép ở tầng database; còn service_role key và mọi thứ liên quan đến xử lý mật khẩu thì tuyệt đối chỉ nằm phía server và không bao giờ commit vào Git.