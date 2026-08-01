# 🌊 Flow State — Smooth Flow Task Manager

[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions)](https://github.com/features/actions)

**Flow State** là ứng dụng quản lý công việc (Task Manager) hiện đại với giao diện **Glassmorphism**, hiệu ứng mượt mà và hệ thống quản lý dữ liệu thời gian thực (Realtime) an toàn tuyệt đối. Được thiết kế theo phong cách thiết kế từ **Google Stitch**, tối ưu hóa trải nghiệm làm việc tập trung cao độ (Flow State).

---

## ✨ Tính Năng Nổi Bật (Key Features)

### 🎯 Quản Lý Công Việc & Vital Tasks
- **Dashboard Tập Trung:** Theo dõi tổng quan công việc, thống kê tỷ lệ hoàn thành và thông tin quan trọng.
- **Vital Tasks (Công việc quan trọng):** Bộ lọc ưu tiên tự động cho các công việc mức độ `High` hoặc được đánh dấu quan trọng.
- **Optimistic Updates:** Thao tác check hoàn thành, tạo mới, chỉnh sửa phản hồi ngay lập tức trên UI trước khi đồng bộ Server.
- **Thùng Rác & Khôi Phục (Soft Delete):** Xóa tạm thời công việc vào thùng rác, hỗ trợ khôi phục hoặc xóa vĩnh viễn trong 30 ngày.

### 🏷️ Danh Mục Realtime (Task Categories)
- Quản lý danh mục công việc với bảng màu sắc tùy chỉnh.
- **Supabase Realtime Sync:** Tự động đồng bộ các thay đổi danh mục tức thì giữa các thiết bị mà không cần reload trang.

### 🔍 Tìm Kiếm Thông Minh (Search Autocomplete)
- Tìm kiếm tức thì không phân biệt dấu Tiếng Việt (Diacritic-insensitive).
- **Keyboard Navigation:** Sử dụng phím `🠗`, `🠕`, `Enter` và `Esc` để duyệt và chọn công việc mượt mà.
- Highlight từ khóa chính xác và an toàn với regex escape.

### 📅 Lịch Công Việc Mượt Mà (Calendar Popover)
- Giao diện lịch nhỏ gọn tích hợp trực tiếp trên thanh công cụ.
- Hiển thị chấm màu đánh dấu mức độ ưu tiên của công việc theo từng ngày.
- Thêm nhanh công việc trực tiếp theo ngày đã chọn.

### 🔔 Trung Tâm Thông Báo (Notification Center)
- Cảnh báo thời gian thực các việc **Đã quá hạn (Overdue)**, **Sắp đến hạn trong 24h (Due Soon)** và **Công việc quan trọng (Vital Tasks)**.
- Thao tác nhanh (Đã xong, Ẩn thông báo) và hỗ trợ Toast Hoàn tác (Undo).

### 🛡️ Bảo Mật & Tài Khoản (Security & User Profile)
- **Supabase Auth & RLS:** Phân quyền Row Level Security trực tiếp ở tầng Database (User A tuyệt đối không thể đọc/ghi dữ liệu của User B).
- **Cập Nhật Hồ Sơ & Avatar:** Tải lên avatar cá nhân, nén ảnh tự động trên client và cập nhật thông tin tài khoản.
- **Đổi Mật Khẩu An Toàn:** Tích hợp quy trình đổi mật khẩu bảo mật qua Supabase Auth.
- **Chống XSS & CSP:** Lọc dữ liệu đầu vào không dùng thư viện ngoài nặng nề, tích hợp Security Headers (Content Security Policy) chặt chẽ.

### 🌗 Giao Diện Glassmorphic & Dark Mode
- Đầy đủ 3 chế độ chủ đề: `Light Mode`, `Dark Mode` và `System`.
- Giao diện mượt mà với tông màu Indigo/Purple Glassmorphism hiện đại.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện |
|---|---|
| **Frontend Framework** | Next.js 16 (App Router + Turbopack) |
| **UI Library** | React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 + Custom Glassmorphism |
| **Icon Set** | Lucide React |
| **Backend & Database** | Supabase (PostgreSQL + RLS + Realtime) |
| **Authentication** | Supabase Auth (Email/Password & Session Cookies) |
| **State & Cache** | TanStack React Query v5 |
| **Validation & Security** | Zod + Custom XSS Sanitizer |
| **CI/CD Pipeline** | GitHub Actions (Node.js 22 LTS, Type-check & Production Build) |

---

## 📁 Cấu Trúc Dự Án (Project Structure)

```text
Flow State/
├── .github/workflows/      # Cấu hình CI/CD Pipeline (GitHub Actions)
├── app/                    # Next.js App Router
│   ├── (auth)/             # Route Đăng nhập / Đăng ký
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/          # Giao diện chính ứng dụng
│   │   ├── categories/     # Quản lý danh mục
│   │   ├── settings/       # Cài đặt tài khoản & Mật khẩu
│   │   ├── tasks/          # Toàn bộ danh sách công việc
│   │   ├── vital/          # Công việc quan trọng
│   │   └── page.tsx        # Dashboard tổng quan
│   ├── globals.css         # Custom Glassmorphism CSS design system
│   └── layout.tsx          # Root Layout & Theme Provider
├── components/             # UI Components
│   ├── auth/               # Form Đăng nhập/Đăng ký
│   ├── layout/             # Header, Sidebar, Navbar, ThemeToggle
│   ├── todo/               # TodoForm, TodoList, TodoItem, TrashModal...
│   ├── ui/                 # Modal, Badge, FloatingPanel, State Skeletons
│   └── widget/             # SearchAutocomplete, CalendarPopover, NotificationPopover
├── hooks/                  # Custom React Hooks & React Query (useTodos, useCategories, useAuth...)
├── lib/                    # Supabase Client/Server, Validation Zod, Sanitizer, Logger
├── supabase/               # Database SQL Migrations & RLS Policies
├── proxy.ts                # Next.js Middleware Security Headers & Auth Guard
└── package.json
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Getting Started)

### 1. Yêu cầu môi trường
- **Node.js**: `v22.0.0` trở lên
- **npm**: `v10.0.0` trở lên

### 2. Cài đặt Dependencies
```bash
git clone https://github.com/ThuanTran260/To-do-List.git
cd "Flow State"
npm install
```

### 3. Cấu hình Biến Môi Trường (`.env.local`)
Tạo file `.env.local` ở thư mục gốc dự án:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Khởi Chạy Server Phát Triển (Dev Server)
```bash
npm run dev
```
Mở trình duyệt tại đường dẫn `http://localhost:3000`.

### 5. Lệnh Kiểm Tra & Build Production
```bash
# Kiểm tra Type-check TypeScript
npx tsc --noEmit

# Kiểm tra Linter
npm run lint

# Thử nghiệm Build Production thành phẩm
npm run build
```

---

## 🔒 Kiến Trúc Bảo Mật & RLS (Security Architecture)

Dự án áp dụng chặt chẽ quy tắc **Zero-Trust Frontend**:
- **Row Level Security (RLS):** Mọi bảng trong Database Postgres (`todos`, `categories`) đều bật RLS. Dữ liệu truy vấn luôn được lọc theo `auth.uid() = user_id`.
- **An Toàn Key:** Chỉ lộ `NEXT_PUBLIC_SUPABASE_ANON_KEY` phía Frontend. `SERVICE_ROLE_KEY` tuyệt đối không xuất hiện ở client.
- **Chống XSS & CSRF:** Tự động lọc các thẻ HTML/Script độc hại từ Input và áp dụng bộ Security Headers HTTP (CSP, X-Frame-Options DENY, SameSite Cookie).

---

## 🤝 Đóng Góp & Giấy Phép (License)

Dự án thuộc sở hữu cá nhân và được phát triển nhằm mục đích tối ưu trải nghiệm quản lý công việc mượt mà.

© 2026 **Flow State**. All rights reserved.
