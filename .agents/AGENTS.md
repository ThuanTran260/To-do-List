# Context Engineering & AI Execution Rules: Flow State (Next.js + Supabase + Superpowers)

> Tài liệu này vừa là "bộ não" tham chiếu kiến trúc, vừa chứa các QUY TẮC BẮT BUỘC (System Rules) dành cho AI Agent khi làm việc với dự án này.

---

## 🚫 QUY TẮC GIT & REMOTE REPOSITORY (BẮT BUỘC)
- **TUYỆT ĐỐI KHÔNG TỰ ĐỘNG `git push`**:
  - AI Assistant chỉ thực hiện các thao tác Git cục bộ (`git add`, `git commit`, `git status`, `git diff`, `git branch`).
  - Sau khi hoàn thành và commit xong, chỉ thông báo cho người dùng và để người dùng tự quyết định thời điểm push lên GitHub.

---

## 0. Quy Tắc Bắt Buộc Sử Dụng Superpowers Skills (Superpowers Mandatory Execution Rules)

AI Agent làm việc trên dự án này **TUYỆT ĐỐI BẮT BUỘC** phải áp dụng bộ quy trình kỹ năng trong thư mục `.agents/skills/superpowers/skills/` và `.agents/skills/`:

1. **BẮT BUỘC ÁP DỤNG `systematic-debugging` KHI CÓ LỖI / BUG:**
   - Tuân thủ nghiêm ngặt **The Iron Law**: **KHÔNG BAO GIỜ SỬA CODE KHI CHƯA TÌM RA NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS - RCA)**.
   - Phải phân tích kỹ các yếu tố kiến trúc sâu: Stacking Context (`backdrop-blur`, `will-change`, `transform`), Overflow Clipping, Z-Index Token Hierarchy, Dynamic Viewport Height (`dvh`), và Virtual Keyboard interactions.
   - Ưu tiên các giải pháp bền vững (như React Portal Engine `createPortal`) thay vì vá lỗi bề mặt (như tăng z-index tạm thời).

2. **BẮT BUỘC ÁP DỤNG `verification-before-completion` TRƯỚC KHI KẾT THÚC:**
   - Không được tuyên bố hoàn thành hay báo lỗi đã sửa xong khi chưa chạy kiểm thử thực tế.
   - Phải chạy `npx tsc --noEmit` (đảm bảo 0 lỗi type) và `npm run build` (đảm bảo biên dịch Next.js thành công 100%).

3. **BẮT BUỘC TẠO `implementation_plan.md` CHO CÁC THAY ĐỔI KIẾN TRÚC/UI NẶNG:**
   - Phân tích nguyên nhân, đề xuất giải pháp, dự đoán xung đột và chờ sự phê duyệt của người dùng trước khi tiến hành viết code.

4. **BẮT BUỘC REVIEW PLAN TRƯỚC KHI CODE (Planning Review Gate — Áp dụng từ 2026-08-31 sau bài học CR-01→CR-06):**
   - **Không được code khi plan chưa qua review:** Mọi `implementation_plan.md` phải được review bởi ít nhất 1 reviewer độc lập (human hoặc AI `requesting-code-review` / `plan-document-reviewer-prompt.md`) trước khi sang Pha 3.
   - **Bắt buộc dùng `dispatching-parallel-agents` để audit plan:** Dispatch 2-3 subagents song song (Security / Logic / DB-Migration) cross-reference plan với source thực tế (30+ files, 6 migrations, `next.config.ts`/`vercel.json`/`app/layout.tsx`). Single-agent audit bị cấm cho plan P0.
   - **Checklist Cross-Reference Bắt Buộc (phải tick trước khi duyệt):**
     - [ ] `grep CREATE POLICY` vs `DROP POLICY` diff — không sót policy legacy (PERMISSIVE OR = bypass, bài học CR-06)
     - [ ] `ls supabase/migrations | sort` vs thứ tự `DROP`/`CREATE` trong plan — đúng timestamp (CR-01)
     - [ ] Tên policy trong plan khớp 100% với tên trong migration SQL gốc (CR-02)
     - [ ] Thiếu `UPDATE` policy cho `upsert:true` (CR-03)
     - [ ] Template literal `${nonce}` phải nằm trong `` ` `` không phải `"` (CR-04)
     - [ ] In-memory structures có GC + doc serverless limitation (CR-05)
     - [ ] End-to-end flow: middleware set header/cookie → layout đọc `headers()` → component dùng — không đứt đoạn (MD-10, MD-03)
     - [ ] Triple header source (`middleware.ts` vs `next.config.ts` vs `vercel.json`) không overwrite CSP (MD-11)
     - [ ] Call-site client đã sửa cùng server (Sidebar GET → POST, MD-13)
     - [ ] Error messages đã sanitize, không leak `err.message` (MD-14)
   - **Self-Review 3 bước của `writing-plans` phải ghi log:** Ghi rõ Spec coverage / Placeholder scan / Type consistency đã chạy, dán output vào cuối plan.
   - **Ghi Appendix `Review Response Log`:** Mỗi vòng review phải append bảng `CR/MD → Verdict → Fix Applied` vào plan trước khi duyệt.

5. **BẮT BUỘC `requesting-code-review` SAU MỖI PHASE:**
   - Sau Phase 1 (Security), Phase 2 (Logic), Phase 4 (Storage) phải gọi `requesting-code-review` trước khi merge sang phase tiếp theo.

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

---

## 6. TipTap / ProseMirror & Rich Text Editor Invariants (Quy Tắc Bắt Buộc Khi Soạn Thảo)

Khi làm việc với `@tiptap/react`, `@tiptap/extension-task-list`, và Tailwind CSS Typography (`.prose`):

1. **QUY TẮC CÔ LẬP `not-prose` (Not-Prose Isolation Invariant):**
   - Không bao giờ để `.prose` tự do can thiệp vào các thành phần có cấu trúc con đặc biệt như `TaskList`, `TaskItem`, `CodeBlock`.
   - Bắt buộc phải cấu hình `HTMLAttributes` trực tiếp trong Extension:
     ```tsx
     TaskList.configure({
       HTMLAttributes: {
         class: 'not-prose task-list space-y-1 my-2 p-0 list-none',
       },
     }),
     TaskItem.configure({
       nested: true,
       HTMLAttributes: {
         class: 'flex flex-row items-start gap-2.5 my-1 list-none',
       },
     }),
     ```

2. **QUY TẮC HÌNH HỌC ĐƯỜNG CƠ SỞ (Geometric Line-Height Equality):**
   - Để tránh checkbox và con trỏ văn bản bị tách thành 2 dòng:
     - Khóa cứng `height: 1.5rem !important; line-height: 1.5rem !important;` trên `<label>` bọc checkbox.
     - Khóa cứng `line-height: 1.5rem !important; min-height: 1.5rem !important; margin: 0 !important;` trên thẻ `<p>` bên trong `<div>`.
     - Đặt `align-items: flex-start !important;` trên `li[data-type="taskItem"]` để ô checkbox luôn bám cố định vào dòng đầu tiên.

3. **QUY TẮC CHỐNG CƯỚP FOCUS (Toolbar Focus Stealing Prevention):**
   - Mọi `<button>` trên thanh công cụ soạn thảo **bắt buộc phải có `onMouseDown={(e) => e.preventDefault()}`** để ngăn trình duyệt cướp focus khỏi vùng văn bản.

4. **QUY TẮC LUỒNG DỮ LIỆU 1 CHIỀU CHO AUTOSAVE (Unidirectional Buffer Engine):**
   - TipTap ProseMirror AST là **Single Source of Truth** duy nhất khi đang soạn thảo.
   - Tuyệt đối không dùng 2-way sync `useEffect` gọi `editor.commands.setContent()` khi `content` state thay đổi trong cùng 1 ghi chú (nguyên nhân gây ra `Maximum update depth exceeded`).
   - Chỉ gọi `setContent` khi chuyển hẳn sang một `note.id` khác.
   - Lưu trữ dữ liệu đang gõ vào `refs` (`dataRef.current`) để hàm debounce autosave đọc trực tiếp, triệt tiêu 100% Stale Closures.

5. **QUY TẮC CẬP NHẬT SUPABASE POSTGREST (Optimistic Lock Invariant):**
   - Không so sánh chuỗi `updated_at` trong mệnh đề `.eq('updated_at', ...)` của REST URL query trên Supabase vì sự sai lệch độ chính xác microsecond (6 chữ số trong PostgreSQL vs 3 chữ số trong JS `toISOString()`) gây ra lỗi `406 Not Acceptable (PGRST116)`.
   - Update trực tiếp bằng `.eq('id', id).eq('user_id', user.id)` và để PostgreSQL trigger tự sinh `updated_at` mới nhất.

---

## 7. 🚀 Bảng Tra Cứu 15 Skills (Superpowers & TipTap) & Kế Hoạch Vận Hành 4 Pha

| # | Skill Name | Mục đích & Mô tả cốt lõi | Bối cảnh kích hoạt | Quy tắc bắt buộc (Iron Rules) |
|---|---|---|---|---|
| 1 | **`systematic-debugging`** | Phân tích nguyên nhân gốc rễ (Root Cause Analysis - RCA) và sửa lỗi hệ thống | Khi gặp bug, crash, lỗi hydration, sai lệch hành vi | **THE IRON LAW:** KHÔNG BAO GIỜ sửa code khi chưa tìm ra RCA. |
| 2 | **`verification-before-completion`** | Thẩm định & kiểm thử thực tế trước khi tuyên bố hoàn thành | Trước khi kết thúc turn làm việc hoặc báo "đã fix" | **BẮT BUỘC:** Chạy `npx tsc --noEmit` (0 lỗi) & `npm run build` (Build OK 100%). |
| 3 | **`writing-plans`** | Lập tài liệu kiến trúc & kế hoạch thực thi chi tiết (`implementation_plan.md`) | Khi thay đổi kiến trúc nặng, refactor lớn, tính năng mới | Phân tích rủi ro, open questions và chờ user phê duyệt trước khi code. |
| 4 | **`executing-plans`** | Thực thi theo kế hoạch đã phê duyệt | Ngay sau khi user duyệt `implementation_plan.md` | Thực hiện từng step, verify liên tục và báo cáo minh bạch. |
| 5 | **`brainstorming`** | Phân tích ý tưởng, khảo sát phương án và trade-offs | Đầu nhiệm vụ mới, khi yêu cầu chưa rõ ràng | Đưa ra các lựa chọn cụ thể kèm ưu/nhược điểm. |
| 6 | **`test-driven-development`** | Viết test case trước khi viết code triển khai (Red ➔ Green ➔ Refactor) | Tạo helper, utility, Zod schemas, API handlers nhạy cảm | Viết test fail trước ➔ viết code pass ➔ tối ưu. |
| 7 | **`subagent-driven-development`** | Phân rã nhiệm vụ và ủy quyền cho AI Subagents chuyên biệt | Tác vụ phức tạp gồm nhiều pha độc lập (Worker, Reviewer) | Mỗi subagent làm đúng phạm vi role, có nghiệm thu độc lập. |
| 8 | **`dispatching-parallel-agents`** | Kích hoạt nhiều subagent chạy song song | Quét bảo mật toàn repo, audit song song | Tự động tổng hợp kết quả khi subagents hoàn thành. |
| 9 | **`requesting-code-review`** | Gửi yêu cầu review code độc lập | Sau khi hoàn thành một milestone quan trọng | Cung cấp diff chi tiết cho reviewer. |
| 10 | **`receiving-code-review`** | Tiếp thu và xử lý phản hồi code review | Khi nhận phản hồi từ reviewer hoặc user | Kiểm tra lại lập luận, sửa triệt để các edge cases. |
| 11 | **`using-git-worktrees`** | Cô lập môi trường nhánh tính năng bằng Git Worktree | Làm việc trên nhiều tính năng mà không làm dơ workspace | Giữ nhánh `main` luôn sạch và build được production. |
| 12 | **`finishing-a-development-branch`** | Đóng nhánh phát triển, nghiệm thu, merge và dọn dẹp | Khi tính năng đã hoàn thành 100% và qua kiểm định | Rebase/merge sạch, chạy verification cuối cùng. |
| 13 | **`using-superpowers`** | Harness điều phối trung tâm định hướng gọi các skills | Khi bắt đầu bất kỳ tác vụ nào để xác định skill phù hợp | Luôn tuân thủ luồng: Brainstorm ➔ Plan ➔ Execute ➔ Verify. |
| 14 | **`writing-skills`** | Cấu trúc, tác giả và kiểm thử các Superpowers Skills mới | Khi cần mở rộng bộ kỹ năng AI cho dự án | Tuân thủ định dạng YAML frontmatter + markdown chuẩn. |
| 15 | **`tiptap-prosemirror-best-practices`** | Cẩm nang quy chuẩn TipTap, Tailwind Typography, Autosave & PostgREST | Soạn thảo rich text, checklist, format, autosave | Tuân thủ 5 TipTap Invariants tại Mục 6. |

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