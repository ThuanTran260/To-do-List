# 🛡️ Bảo Mật — Flow State

> Tài liệu tổng hợp kiến trúc bảo mật, chính sách phân quyền dữ liệu (RLS), quy trình xác thực JWT và bộ checklist triển khai của dự án **Flow State** — Next.js 16 + Supabase + Vercel.
> Gộp từ `security.md` và `check_list.md` cũ. Cập nhật lần cuối: 2026-08-30.

---

## 1. 🌐 Next.js 16 Proxy Session Guard & Cookie Management

- **File cấu hình:** `proxy.ts` & `lib/supabase/middleware.ts`
- **Cơ chế:** Sử dụng `@supabase/ssr` trong Next.js 16 Proxy (`export function proxy()`).
- **Server-Side Verification (`getUser`):**
  - Mọi request (trừ static assets) đều gọi `supabase.auth.getUser()`.
  - Không tin tưởng payload đệm ở client, bắt buộc xác minh chữ ký JWT với Supabase Auth Server.
  - Tự động refresh token khi access token hết hạn và ghi lại cookie mới vào response.
- **Route Guard:**
  - Chưa đăng nhập mà truy cập `/dashboard/*` ➔ Chuyển hướng về `/login`.
  - Đã đăng nhập mà truy cập `/login` hoặc `/signup` ➔ Chuyển hướng vào `/dashboard`.

---

## 2. 🔐 Security Headers & Defense-in-Depth

Ứng dụng được bảo vệ bởi bộ Security Headers trên cả Proxy Server và `next.config.ts`:

| Security Header | Giá trị / Mục đích |
|---|---|
| `Content-Security-Policy` | Giới hạn nguồn script, font Google, kết quả Supabase |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (HSTS) |
| `X-Frame-Options` | `DENY` (Chống Clickjacking) |
| `X-Content-Type-Options` | `nosniff` (Chống MIME Sniffing) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

- **Dynamic Nonce-based CSP:** Sinh nonce ngẫu nhiên per-request trong middleware, loại bỏ `'unsafe-inline'` ở production.

---

## 3. 🗄️ Row Level Security (RLS) & Storage Access Control

Tất cả bảng trong Postgres DB đều **deny-by-default** và chỉ cho phép truy cập theo chính sách:

### 3.1 Bảng Dữ Liệu (`todos`, `profiles`, `categories`, `tags`, `todo_tags`, `task_templates`)
- RLS **BẬT** trên toàn bộ bảng.
- Policy đầy đủ 4 thao tác: `select_own_*`, `insert_own_*`, `update_own_*`, `delete_own_*` với `auth.uid() = user_id`.
- Policy UPDATE có **cả** `USING` **và** `WITH CHECK` — chống leo quyền sửa dữ liệu người khác.
- B-tree Index trên `user_id` ở tất cả các bảng (`supabase/migrations/20260808000000_add_user_id_indexes.sql`).

### 3.2 Security Definer Functions
- Các hàm `handle_new_user()` và `purge_old_deleted_todos()` được gán `set search_path = public` (chống search_path injection).
- Đã thu hồi quyền thực thi công khai: `revoke execute on function ... from public, anon, authenticated;`.

### 3.3 Storage Objects (`task-attachments`, `avatars`)
- **SELECT:** Public cho phép đọc ảnh đại diện và đính kèm.
- **INSERT:** Yêu cầu `auth.role() = 'authenticated'`.
- **DELETE (Hardened):** Yêu cầu chính chủ `(auth.uid() = owner OR auth.uid()::text = owner_id)`. Bật bảo vệ chống xóa chéo tập tin.

---

## 4. 🔑 Logout & In-App Browser Storage Isolation

- **Global Revocation:** `supabase.auth.signOut({ scope: 'global' })` hủy vĩnh viễn refresh token trên Supabase Auth DB.
- **Selective LocalStorage Purge:** Khi đăng xuất hoặc tạo tài khoản mới, ứng dụng chỉ xóa các key JWT chứa `sb-*`, **giữ nguyên cài đặt người dùng** như `flowstate-theme`.
- **Discord WebView Isolation:** Purge `sessionStorage` và ép chuyển hướng cứng (`window.location.href = '/login'`) để tránh bị cache lại token cũ trên trình duyệt nhúng di động.

---

## 5. 🧼 Input Validation & Sanitization

- **Zod Schema:** Validate dữ liệu đầu vào (email, password >= 8 ký tự, UUIDs).
- **Sanitization:** `lib/sanitize.ts` tự động loại bỏ thẻ HTML `<script>`, `<style>` và mã độc trước khi lưu vào DB.
- **Logger Masking:** `lib/logger.ts` tự động che giấu (`***REDACTED***`) các trường nhạy cảm như `password`, `token`, `secret`.

---

## 6. 🚨 Error Handling & Infrastructure

- React Error Boundary khu vực Dashboard: `app/dashboard/error.tsx`.
- Root Error Boundary cho toàn hệ thống: `app/error.tsx` & `app/global-error.tsx`.
- Vercel Deployment Configuration (`vercel.json`): Security Headers, CDN Optimization (`sin1`).

---

## 7. ✅ Checklist Triển Khai (Deploy Readiness)

> Quy ước: ✅ = Đã hoàn tất & Đạt chuẩn. Kiểm định bởi hệ thống AI Multi-Agent ngày 2026-08-08.

### 7.1. RLS & Indexing — ✅ Toàn bộ (xem mục 3)

### 7.2. Authentication Settings (Thao tác Dashboard)

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Email Confirmation | ⚠️ Thao tác Dashboard | Supabase Dashboard > Auth > Settings |
| 2 | Leaked Password Protection | ⚠️ Thao tác Dashboard | Supabase Dashboard > Auth > Settings |
| 3 | Rate Limiting cho Auth | ⚠️ Thao tác Dashboard | Supabase Dashboard > Auth > Rate Limits |

### 7.3. Environment Variables & Secrets

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 4 | `.env*` trong `.gitignore` | ✅ | `.env*` đã được ignore |
| 5 | `NEXT_PUBLIC_SUPABASE_URL` dùng env var | ✅ | `lib/supabase/client.ts` |
| 6 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` dùng env var | ✅ | `lib/supabase/client.ts` |
| 7 | `service_role` key KHÔNG xuất hiện ở frontend | ✅ | Đã kiểm tra 0 kết quả lộ key |

### 7.4. Middleware & Headers

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 8 | `proxy.ts` bảo vệ route `/dashboard/*` | ✅ | Chuyển hướng 100% người dùng chưa đăng nhập về `/login` |
| 9 | Redirect `/dashboard` nếu đã authenticated ở trang auth | ✅ | Tự động chuyển hướng sang `/dashboard` |
| 10 | Refresh Auth Cookies tự động per-request | ✅ | Đồng bộ cookie `@supabase/ssr` trong middleware |
| 11 | Dynamic Nonce-based CSP | ✅ | Loại bỏ `'unsafe-inline'` ở production |
| 12 | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security` | ✅ | `next.config.ts` & `vercel.json` |

---

*Đã hoàn thành 100% các hạng mục P0/P1/P2 về code & infrastructure (2026-08-08).*
