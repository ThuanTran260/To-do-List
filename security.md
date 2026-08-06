# 🛡️ Kiến Trúc & Chính Sách Bảo Mật — Flow State

Tài liệu này ghi nhận toàn bộ các lớp bảo mật, chính sách phân quyền dữ liệu (RLS), quy trình xác thực JWT và các biện pháp bảo vệ hệ thống của dự án **Flow State**.

---

## 1. 🌐 Next.js 16 Proxy Session Guard & Cookie Management

- **File cấu hình:** [`proxy.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/proxy.ts) & [`lib/supabase/middleware.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/lib/supabase/middleware.ts)
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

Ứng dụng được bảo vệ bởi bộ Security Headers trên cả Proxy Server và [`next.config.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/next.config.ts):

| Security Header | Giá trị / Mục đích |
|---|---|
| `Content-Security-Policy` | Giới hạn nguồn script, font Google, kết quả Supabase |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (HSTS) |
| `X-Frame-Options` | `DENY` (Chống Clickjacking) |
| `X-Content-Type-Options` | `nosniff` (Chống MIME Sniffing) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

## 3. 🗄️ Row Level Security (RLS) & Storage Access Control

Tất cả bảng trong Postgres DB đều **deny-by-default** và chỉ cho phép truy cập theo chính sách:

### 3.1 Bảng Dữ Liệu (`todos`, `profiles`, `categories`)
- `select_own_*`: `auth.uid() = user_id`
- `insert_own_*`: `auth.uid() = user_id`
- `update_own_*`: `auth.uid() = user_id`
- `delete_own_*`: `auth.uid() = user_id`

### 3.2 Security Definer Functions
- Các hàm `handle_new_user()` và `purge_old_deleted_todos()` được gán `set search_path = public`.
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
