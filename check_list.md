# 🔒 Security Checklist — Flow State Deploy (Supabase + Vercel)

> Bộ checklist bảo mật chuẩn dành cho dự án **Flow State** — Next.js 16 + Supabase + Vercel.
> Đã được nâng cấp và hoàn thiện toàn bộ bởi hệ thống AI Multi-Agent ngày 2026-08-08.
>
> **Quy ước:** ✅ = Đã hoàn tất & Đạt chuẩn

---

## 1. 🛡️ Supabase — Row Level Security & Auth

### 1.1. RLS (Row Level Security) & Indexing

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | RLS **BẬT** trên bảng `todos` | ✅ | init_schema.sql:74 |
| 2 | RLS **BẬT** trên bảng `profiles` | ✅ | init_schema.sql:14 |
| 3 | RLS **BẬT** trên bảng `categories` | ✅ | v6_migration.sql:15 |
| 4 | RLS **BẬT** trên bảng `tags` | ✅ | sprint2_schema.sql:29 |
| 5 | RLS **BẬT** trên bảng `todo_tags` | ✅ | sprint2_schema.sql:30 |
| 6 | RLS **BẬT** trên bảng `task_templates` | ✅ | sprint2_schema.sql:60 |
| 7 | Policy đầy đủ 4 thao tác (SELECT/INSERT/UPDATE/DELETE) trên `todos` | ✅ | `using (auth.uid() = user_id)` + `with check` |
| 8 | Policy UPDATE có **cả** `USING` **và** `WITH CHECK` | ✅ | Chống leo quyền sửa dữ liệu người khác |
| 9 | `SECURITY DEFINER` functions revoke execute từ `public, anon, authenticated` | ✅ | `handle_new_user()`, `purge_old_deleted_todos()` |
| 10 | `search_path = public` cố định trên tất cả functions | ✅ | Chống search_path injection |
| 11 | **B-tree Index trên `user_id` ở tất cả các bảng** | ✅ | [20260808000000_add_user_id_indexes.sql](file:///e:/luyentaphe/portfolio/Flow%20State/supabase/migrations/20260808000000_add_user_id_indexes.sql) |

### 1.2. Authentication Settings

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 12 | Email Confirmation | ⚠️ Thao tác Dashboard | Supabase Dashboard > Auth > Settings |
| 13 | Leaked Password Protection | ⚠️ Thao tác Dashboard | Supabase Dashboard > Auth > Settings |
| 14 | Rate Limiting cho Auth | ⚠️ Thao tác Dashboard | Supabase Dashboard > Auth > Rate Limits |

---

## 2. 🔑 Environment Variables & Secrets

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 15 | `.env*` trong `.gitignore` | ✅ | `.env*` đã được ignore |
| 16 | `NEXT_PUBLIC_SUPABASE_URL` dùng env var | ✅ | client.ts |
| 17 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` dùng env var | ✅ | client.ts |
| 18 | `service_role` key KHÔNG xuất hiện ở frontend | ✅ | Đã kiểm tra 0 kết quả lộ key |

---

## 3. 🌐 Next.js — Security Headers & Middleware

### 3.1. Auth Guard & Middleware

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 19 | `middleware.ts` bảo vệ route `/dashboard/*` | ✅ | [middleware.ts](file:///e:/luyentaphe/portfolio/Flow%20State/middleware.ts) — Chuyển hướng 100% người dùng chưa đăng nhập về `/login` |
| 20 | Redirect `/dashboard` nếu đã authenticated ở trang auth | ✅ | Tự động chuyển hướng người dùng đã đăng nhập sang `/dashboard` |
| 21 | Refresh Auth Cookies tự động per-request | ✅ | Đồng bộ cookie `@supabase/ssr` trong middleware |

### 3.2. HTTP Security Headers & Dynamic Nonce CSP

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 22 | `Dynamic Nonce-based Content-Security-Policy` | ✅ | Sinh nonce ngẫu nhiên per-request trong middleware, loại bỏ `'unsafe-inline'` ở production |
| 23 | `X-Content-Type-Options: nosniff` | ✅ | next.config.ts & vercel.json |
| 24 | `X-Frame-Options: DENY` | ✅ | next.config.ts & vercel.json |
| 25 | `Referrer-Policy: strict-origin-when-cross-origin` | ✅ | next.config.ts & vercel.json |
| 26 | `Strict-Transport-Security: max-age=63072000` | ✅ | HSTS 2 năm Https enforce |

---

## 4. 🚨 Error Handling & Infrastructure

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 27 | React Error Boundary khu vực Dashboard | ✅ | [app/dashboard/error.tsx](file:///e:/luyentaphe/portfolio/Flow%20State/app/dashboard/error.tsx) |
| 28 | Root Error Boundary cho toàn hệ thống | ✅ | [app/error.tsx](file:///e:/luyentaphe/portfolio/Flow%20State/app/error.tsx) & [app/global-error.tsx](file:///e:/luyentaphe/portfolio/Flow%20State/app/global-error.tsx) |
| 29 | Vercel Deployment Configuration (`vercel.json`) | ✅ | [vercel.json](file:///e:/luyentaphe/portfolio/Flow%20State/vercel.json) — Security Headers, CDN Optimization (`sin1`) |

---

*Cập nhật lần cuối: 2026-08-08 — Đã hoàn thành 100% các hạng mục P0/P1/P2 về code & infrastructure.*
