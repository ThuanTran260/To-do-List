# Context Engineering & AI Execution Rules: Flow State (Next.js + Supabase + Superpowers)

> Tài liệu này vừa là "bộ não" tham chiếu kiến trúc, vừa chứa các QUY TẮC BẮT BUỘC (System Rules) dành cho AI Agent khi làm việc với dự án này.

---

## 🚫 QUY TẮC GIT & REMOTE REPOSITORY (BẮT BUỘC)
- **TUYỆT ĐỐI KHÔNG TỰ ĐỘNG `git push`**:
  - AI Assistant chỉ thực hiện các thao tác Git cục bộ (`git add`, `git commit`, `git status`, `git diff`, `git branch`).
  - Sau khi hoàn thành và commit xong, chỉ thông báo cho người dùng và để người dùng tự quyết định thời điểm push lên GitHub.

---

## ⛔ AN TOÀN TERMINAL & CẤM LỆNH NGUY HIỂM (BẮT BUỘC - HARNESS HARD CONSTRAINT)
> MIRROR — bản chuẩn duy nhất là `AGENTS.md` (root) §Terminal safety. Không sửa section này tại đây; sửa root rồi sync + đóng dấu ngày/commit. Last synced: 2026-09-07 d4572fe.
- **TUYỆT ĐỐI KHÔNG ĐƯA RA HOẶC TỰ ĐỘNG CHẠY CÁC CÂU LỆNH NGUY HIỂM / PHÁ HỦY HỆ THỐNG**:
  - **Xóa / Format / Phân vùng ổ đĩa:** Cấm triệt để `format`, `Format-Volume`, `Clear-Disk`, `Remove-Partition`, `Initialize-Disk`, `diskpart`, `mkfs`, `dd`, `fdisk`, `parted`, `shred`, `wipefs`, `Remove-Volume`, `Repair-Volume`, `Reset-PhysicalDisk`, `Set-Disk`, `Set-Partition`.
  - **Can thiệp Boot / Hệ điều hành / Registry:** Cấm `bcdedit`, `bootrec`, `vssadmin delete`, `cipher /w`, `sdelete`, `reg delete`.
  - **Tắt / Khởi động lại máy (Power commands):** Cấm `shutdown`, `Restart-Computer`, `Stop-Computer`.
  - **Fork bomb & Thay đổi quyền đệ quy:** Cấm `:(){...}`, `chmod -R /`, `chown -R /`, `icacls` diện rộng.
  - **Lệnh xóa diện rộng & Xóa thư mục gốc mọi ổ đĩa / Hệ thống:** Cấm `rm -rf /`, `rm -rf ~`, `--no-preserve-root`, `rm /dev/sd*`, `rm /dev/nvme*`, `rm /dev/hd*`, và các lệnh PowerShell / CMD xóa nhắm vào thư mục gốc bất kỳ ổ đĩa nào hoặc OS: `Remove-Item`, `del`, `rd`, `erase`, `rmdir` nhắm vào mọi gốc ổ đĩa `C:\`, `D:\`, `E:\` (toàn bộ `[A-Za-z]:\`), `C:\Windows`, `System32`, `Program Files`, User Profile (`C:\Users`, `%USERPROFILE%`, `~`).
  - **Xóa sạch Repository / Ghi đè cấu hình:** Cấm `git clean -f*`, `git reset --hard*` (tránh xóa nhầm file môi trường `.env.local` chưa track), cấm `supabase db push` tự động (phải để người dùng chủ động chạy `[MANUAL]`).
- **Quy tắc phạm vi (Scope Rules):**
  - Chỉ thao tác, tạo hoặc xóa file bên trong phạm vi thư mục workspace của dự án.
  - Tuyệt đối không dùng các kỹ thuật lách luật (aliases, `sudo`, `cmd /c`, `powershell -EncodedCommand`, `curl ... | sh` hoặc rephrase lệnh) để dodge quy tắc này. Hard-enforced bởi `opencode.json` (`permission.bash` deny list).
  - Ưu tiên sử dụng các công cụ file chuyên dụng (`view_file`, `write_to_file`, `replace_file_content`) thay vì dùng lệnh shell delete.

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

3. **BẮT BUỘC TẠO `implementation_plan.md` & CẤM TỰ Ý CODE KHI CHƯA CÓ PROCEED (No Premature Coding):**
   - Phân tích nguyên nhân, đề xuất giải pháp, dự đoán xung đột.
   - **TUYỆT ĐỐI KHÔNG TỰ Ý SỬA / VIẾT SOURCE CODE** khi đang ở bước lập kế hoạch, phân tích hoặc review.
   - Bắt buộc dừng lại chờ sự phê duyệt rõ ràng ("Proceed") từ người dùng trước khi tiến hành viết code.

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

### 6. TipTap / ProseMirror & Rich Text Editor Invariants (Bộ 8 Quy Chuẩn Phòng Vệ Chủ Động)

Khi làm việc với `@tiptap/react`, `@tiptap/extension-task-list`, Tailwind CSS Typography (`.prose`), DOMPurify và Supabase Autosave:

1. **INVARIANT 1: SANITIZATION WHITELIST MIRRORING & SCHEMA PARITY (SWMI):**
   - Mọi extension mới của TipTap (Table, Mention, CodeBlock, Link, Image...) **bắt buộc** phải đăng ký đồng thời cấu trúc thẻ DOM và danh sách attributes vào CẢ HAI file:
     - Client: `lib/clientSanitize.ts` (`ALLOWED_TAGS`, `ALLOWED_ATTR`)
     - Server: `lib/sanitize/serverSanitize.ts` (JSDOM + DOMPurify instance)
   - Mọi extension mới phải có unit test: xuất HTML từ ProseMirror Node, truyền qua `sanitizeHtmlServer()` và `sanitizeHtml()`, xác nhận đầu ra bảo toàn 100% tags và data-attributes đặc thù.

2. **INVARIANT 2: UNIDIRECTIONAL AST AUTHORITY & REACT 19 RENDER PURITY (UAST-P):**
   - TipTap ProseMirror AST là **Single Source of Truth** duy nhất khi đang soạn thảo.
   - Tuyệt đối không dùng 2-way sync `useEffect` gọi `editor.commands.setContent()` khi `content` state thay đổi trong cùng 1 ghi chú (nguyên nhân gây ra `Maximum update depth exceeded`).
   - Chỉ gọi `setContent` khi chuyển hẳn sang một `note.id` khác, và bắt buộc kèm `{ emitUpdate: false }`.
   - Lưu trữ dữ liệu đang gõ vào `refs` (`dataRef.current`) để hàm debounce autosave đọc trực tiếp, triệt tiêu 100% Stale Closures.
   - Tuân thủ React 19 Ref Purity: Toàn bộ thao tác đồng bộ `ref` phải nằm trong `useEffect` hoặc event handler (`onUpdate`), không bao giờ gán trực tiếp trong render body.

3. **INVARIANT 3: DUAL-LAYER EMERGENCY UNLOAD & 64KB KEEPALIVE QUOTA (DLEU-K):**
   - Luôn gọi `saveEmergencyDraft()` vào `localStorage` TRƯỚC TIÊN. Thao tác này chạy đồng bộ (synchronous) nên 100% không thể bị ngắt bởi việc đóng tab hay mất mạng.
   - Request nền gửi qua `csrfFetch('/api/notes/sync')` kèm `{ keepalive: true }` bắt buộc phải cắt chuỗi nội dung dưới 50,000 ký tự (`content.slice(0, 50000)`) để luôn nằm trong vùng an toàn của hạn mức 64KB của trình duyệt Chromium/WebKit.

4. **INVARIANT 4: MONOTONIC INTEGER VERSIONING VS TIMESTAMP PRECISION (MIV):**
   - Không so sánh chuỗi `updated_at` trong mệnh đề `.eq('updated_at', ...)` của REST URL query trên Supabase vì sự sai lệch độ chính xác microsecond (6 chữ số trong PostgreSQL vs 3 chữ số trong JS `toISOString()`) gây ra lỗi `406 Not Acceptable (PGRST116)`.
   - Khi cần Optimistic Lock, bổ sung cột `version integer not null default 1` tăng tịnh tiến để phát hiện xung đột chuẩn xác.
   - Client duy trì `saveSeqRef.current++`: Response mạng trả về chậm hơn nhịp lưu mới hơn sẽ bị hủy ngay lập tức, triệt tiêu lỗi ghi đè kết quả cũ.

5. **INVARIANT 5: UNIVERSAL POINTER EVENT NEUTRALIZATION (UPEN):**
   - Mọi `<button>` trên thanh công cụ soạn thảo **bắt buộc phải chặn cả hai sự kiện pointer**:
     ```tsx
     onMouseDown={(e) => e.preventDefault()}
     onTouchStart={(e) => e.preventDefault()}
     ```
     để ngăn trình duyệt cướp focus và loại bỏ triệt để hiện tượng giật bàn phím ảo trên iOS Safari và Android.

6. **INVARIANT 6: STRICT LAYOUT & BASELINE GEOMETRY ISOLATION (SLGI):**
   - Không bao giờ để `.prose` can thiệp vào các thành phần có cấu trúc con đặc biệt như `TaskList`, `TaskItem`, `CodeBlock`.
   - Bắt buộc phải cấu hình `HTMLAttributes: { class: 'not-prose ...' }` trực tiếp trong Extension Config.
   - Khóa cứng `height: 1.5rem !important; line-height: 1.5rem !important;` trên `<label>` bọc checkbox và `line-height: 1.5rem !important; min-height: 1.5rem !important; margin: 0 !important;` trên thẻ `<p>` bên trong `<div>` để ô checkbox luôn bám cố định vào dòng đầu tiên.

7. **INVARIANT 7: MULTI-TAB CONCURRENCY & USER ISOLATION BOUNDARY (MTBC):**
   - Mỗi tab sinh `tabSessionId` ngẫu nhiên khi khởi tạo. Payload gửi qua BroadcastChannel kèm mã này; tab nhận nếu thấy trùng `tabSessionId` của chính mình thì bỏ qua ngay lập tức để ngắt vòng lặp phản hồi đa tab.
   - Khóa nháp định dạng `note_draft_${userId}:${noteId}`. BroadcastChannel chỉ áp dụng payload nếu `payload.userId === currentUserId`. Khi đăng xuất, hàm `clearAllNoteDrafts()` dọn sạch toàn bộ bộ nhớ nháp trên máy.

8. **INVARIANT 8: DOCUMENT SCALABILITY & INP PERFORMANCE ISOLATION (DS-INP):**
   - Áp dụng cổng kiểm tra `transaction.docChanged === true` để bỏ qua các giao dịch chỉ thay đổi vị trí con trỏ (Selection Transactions).
   - Trì hoãn gọi `editor.getHTML()` (Lazy Serialization) cho đến khi hết nhịp debounce 600ms, bảo vệ chỉ số Core Web Vitals **INP** khi văn bản dài hàng nghìn từ.

---

## 7. 🚀 Bảng Tra Cứu 16 Skills (Superpowers & TipTap) & Kế Hoạch Vận Hành 4 Pha

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
| 15 | **`tiptap-prosemirror-best-practices`** | Cẩm nang quy chuẩn TipTap, Tailwind Typography, Autosave & PostgREST | Soạn thảo rich text, checklist, format, autosave | Tuân thủ 8 TipTap Invariants tại Mục 6. |
| 16 | **`session-handoff`** (`.agents/skills/session-handoff/`) | Nén context cạn thành file handoff để session sau tiếp tục không mất tiến độ | Context sắp hết mà việc còn dở (uncommitted, gate đỏ, giữa plan) | Contract 5 sections + facts phải verify bằng lệnh, cấm bịa design, 1 next action duy nhất. |

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

## 8. UI/UX, Layout Stability & Media Invariants (Quy Chuẩn Giao Diện & Chống Vỡ Layout)

### 8.1. Quy tắc cấm Nested Scroll Container trên Card/Form nội trang (In-Page Form Isolation)
- **Tuyệt đối không đặt `max-h-[..dvh] overflow-y-auto` bên trong các Form/Card nằm trực tiếp trên trang workspace.**
- Toàn bộ trang Dashboard đã có cơ chế cuộn mượt mà của phần tử cha (`<main>`). Việc nhúng thêm vùng cuộn con bên trong một card form tạo ra hiện tượng **Nested Scroll (Cuộn lồng cuộn)**, gây kẹt chuột và kích hoạt thanh cuộn bất thường.
- Card form phải luôn co giãn tự nhiên theo chiều cao thực tế của nội dung.

### 8.2. Quy tắc Accordion & Expandable Panel Overflow Containment
- Mọi khối panel mở rộng/thu gọn (`motion.div`) animate chiều cao (`height: 0 -> auto`):
  1. **BẮT BUỘC mang `className="overflow-hidden"`**: Tuyệt đối không dùng `overflow-visible` vì sẽ khiến nội dung con chưa được cắt tỉa tràn ra ngoài, làm container cha nhận diện sai `scrollHeight` và kích hoạt thanh cuộn.
  2. **BẮT BUỘC dùng đường cong không Overshoot**: Sử dụng Cubic-Bezier chuẩn Linear / Apple HIG:
     ```tsx
     transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
     ```
     Tuyệt đối không dùng `spring` có hệ số giảm chấn $\zeta < 1.0$ (underdamped spring như `stiffness: 350, damping: 30`) cho animation chiều cao vì độ nảy (bounce/overshoot) sẽ đẩy chiều cao vượt ngưỡng cho phép, sinh ra thanh cuộn chớp nháy làm vỡ layout.

### 8.3. Quy tắc bắt buộc chuẩn hóa `@utility no-scrollbar` trong Tailwind CSS v4
- Trong Tailwind CSS v4, utility `.no-scrollbar` không có sẵn mặc định. Mọi project dùng Tailwind v4 bắt buộc phải khai báo tường minh trong `app/globals.css`:
  ```css
  @utility no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  ```
  để đảm bảo thanh cuộn được ẩn triệt để trên Chrome, Edge, Safari và Firefox.

### 8.4. Quy tắc Safe Signed Image & Avatar Resolution (Chống 404 Race Condition)
- Khi lưu ảnh vào Supabase Storage, database/metadata chỉ lưu đường dẫn tương đối (ví dụ: `userId/avatar-xxx.webp`), không lưu Signed URL vì Signed URL sẽ hết hạn sau thời gian timeout (thường là 1 giờ).
- Khi trang tải lại (F5 / Refresh): Hook `useSignedAvatarUrl` mất 100-200ms để sinh Signed URL từ server.
- **Quy tắc bất biến:**
  1. `displayUrl` trong hook **TUYỆT ĐỐI CHỈ TRẢ VỀ** URL hợp lệ (`http://`, `https://`, `blob:`). Nếu là đường dẫn storage tương đối mà chưa ký xong, hook **bắt buộc phải trả về `null`** (hoặc skeleton/fallback), tuyệt đối không fallback trực tiếp đường dẫn tương đối vào `src` của thẻ `<img>` / `<Image />`.
  2. Trình duyệt nếu nhận đường dẫn tương đối sẽ gửi HTTP GET về `http://localhost:3000/dashboard/...` gây lỗi `404 Not Found`, kích hoạt sự kiện `onError` và vĩnh viễn khóa avatar thành chữ cái viết tắt "T".
  3. Mọi component hiển thị avatar phải tự động reset state lỗi (`setAvatarError(false)`) mỗi khi `displayUrl` thay đổi.

### 8.5. Quy tắc ổn định CI/CD Pipeline với `.npmrc`
- Trong môi trường build tự động (Vercel, GitHub Actions), `npm` mặc định gửi request kiểm tra audit bảo mật tới `https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`. Endpoint này thường xuyên bị nghẽn và rate-limit (`error 23`).
- Bắt buộc duy trì file `.npmrc` tại thư mục gốc với `audit=false` và timeout 30s để đảm bảo pipeline cài đặt dependencies luôn ổn định 100%.

### 8.6. Quy tắc Phân Nhóm Thời Gian & Tùy Biến Pomodoro (Temporal Grouping & Focus Sessions)
- **Lọc theo tháng (Temporal Grouping)**: Với danh sách công việc lớn, tự động gom nhóm các tháng có dữ liệu (`getAvailableMonths`), mặc định mở tháng gần nhất (`latest`) và cho phép người dùng chọn xem các tháng cũ hoặc tất cả các tháng.
- **Giới hạn hiển thị (Display Limit)**: Luôn cung cấp tùy chọn giới hạn (10, 20, 50, Tất cả), lưu vào `localStorage` và hiển thị banner xem thêm khi số lượng task vượt quá giới hạn.
- **Tùy chỉnh thời lượng phiên tập trung**: Không bao giờ khóa cứng 25 phút. Cho phép bấm trực tiếp để nhập số phút tùy ý (1-720 phút), kết hợp các mốc nhanh (`15p`, `25p`, `45p`, `60p`, `90p`) và lưu lựa chọn của người dùng vào `localStorage`.
