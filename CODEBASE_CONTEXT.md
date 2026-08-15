# 🗺️ Codebase Context & Instant Lookup Guide — Flow State

> **Dành cho AI Agent & Developer:** Tài liệu này bản đồ hóa toàn bộ kiến trúc, luồng xử lý và vị trí chính xác của từng tính năng trong dự án **Flow State**. Khi cần sửa hay thêm tính năng, chỉ cần tra cứu file tương ứng trong bản đồ bên dưới mà không cần đọc lại toàn bộ codebase.

---

## 1. 🛠️ Tech Stack & Quy Tắc Cốt Lõi

| Thành phần | Công nghệ / Thư viện | Ghi chú kiến trúc |
|---|---|---|
| **Framework** | Next.js 16.2 (App Router, Turbopack) + React 19 | Server Component mặc định, Client Component dùng `'use client'` |
| **Backend & Auth** | Supabase Postgres + Auth + Realtime + Storage | Dùng `@supabase/ssr` (`createBrowserClient` & `createServerClient`) |
| **State Management** | TanStack React Query v5 | Quản lý Server State, caching & Optimistic UI Updates |
| **Design System** | **Linear Craft Design System** (Tailwind CSS v4) | Hairline borders (`border-hairline`), Lavender accent (`#5e6ad2`), Surface ladder (`surface-1`, `surface-2`, `surface-3`), 0 AI gradients |
| **Typography & Motion** | Inter + JetBrains Mono + Framer Motion | Tối ưu độ tương phản WCAG AA, micro-animations mượt mà không layout shift |
| **Form & Validation** | Zod + React Hook Form | Input sanitization qua `lib/sanitize.ts` trước khi gửi Supabase |

---

## 2. 🔐 Kiến Trúc Auth & Vòng Đời Cookie (CỰC KỲ QUAN TRỌNG)

- **Client Supabase Client (`lib/supabase/client.ts`):**
  - Ghi đè trực tiếp callback `cookies: { getAll, setAll }` trong `createBrowserClient` để bypass bug `cookieOptions` của `@supabase/ssr`.
  - Đọc động cookie `sb-remember-me`: nếu `true` ➔ cookie hạn 30 ngày (`maxAge: 2592000`), nếu `false` ➔ **Session Cookie** (`maxAge: undefined`).
  - Chứa helper `parseDocumentCookies()` với `safeDecode()` (mã hóa/giải mã đối xứng 100%).
- **Proxy Guard (`proxy.ts` ➔ `lib/supabase/proxy.ts`):**
  - `proxy.ts` ở thư mục gốc là entry point duy nhất (chuẩn Vercel Edge Runtime).
  - Tự động bảo vệ tất cả tuyến đường `/dashboard/*` ➔ redirect chưa auth về `/login`.
  - Tự động redirect người dùng đã đăng nhập từ `/login` & `/signup` vào `/dashboard`.
  - Sinh ngẫu nhiên dynamic `nonce` per-request nhúng vào **Content-Security-Policy (CSP)** header.
- **Server SignOut (`app/auth/logout/route.ts`):**
  - Hỗ trợ cả `GET` và `POST`.
  - Thực hiện `supabase.auth.signOut({ scope: 'global' })` và xóa sạch tất cả cookie `sb-*` bằng `maxAge: 0`.
  - ⚠️ **QUAN TRỌNG - Prefetch Pitfall:** Route này xử lý `GET` request — TUYỆT ĐỐI KHÔNG dùng `<Link href="/auth/logout">` vì Next.js sẽ ngầm prefetch và kích hoạt đăng xuất ngay khi nút xuất hiện trên màn hình. Phải dùng `<a href="/auth/logout">` hoặc `window.location.href`.
- **OAuth Callback (`app/auth/callback/route.ts`):**
  - Xử lý redirect sau khi người dùng xác nhận email hoặc đăng nhập OAuth.

---

## 3. 📂 Bản Đồ Vị Trí Tính Năng (Instant File Lookup)

### 3.1. Quản Lý To-do Core
- **Tạo To-do & Form:** `components/todo/TodoForm.tsx` (Chế độ tạo nhanh & Chi tiết `showExtra`, Natural language dates)
- **Danh sách To-do Main:** `components/todo/TodoList.tsx`
- **Item To-do Đơn:** `components/todo/TodoItem.tsx` (Undo delete qua Sonner toast, overdue badge, image thumbnail)
- **Chi tiết To-do Slide-over:** `components/todo/TaskDetailView.tsx`
- **Modal Chỉnh sửa To-do:** `components/todo/EditTodoModal.tsx`
- **Thùng Rác (Soft Delete):** `components/todo/TrashModal.tsx`
- **Thanh Lọc Danh Mục:** `components/todo/CategoryFilterBar.tsx` (LayoutGroup motion pill)
- **Thẻ Thống Kê:** `components/todo/InsightsCard.tsx`
- **Hooks Mutations & Queries:** `hooks/useTodos.ts` (CRUD, Trash, Optimistic updates)

### 3.2. Drag & Drop Reorder
- **DnD Context Wrapper:** `components/todo/TodoList.tsx` (`DndContext` + `SortableContext`)
- **Sortable Item Wrapper:** `components/todo/SortableTodoItem.tsx`
- **Reorder Mutation:** `useReorderTodos()` trong `hooks/useTodos.ts`

### 3.3. Tags & Categories
- **Picker Thẻ Tag:** `components/ui/TagPicker.tsx`
- **Badges Thẻ Tag:** `components/todo/TagBadges.tsx`
- **Picker Danh Mục:** `components/ui/CustomCategorySelect.tsx` (PortalPopover)
- **Trang Quản lý Danh mục:** `app/dashboard/categories/page.tsx`
- **Hooks:** `hooks/useTags.ts` & `hooks/useCategories.ts`

### 3.4. Subtasks / Checklist
- **Trình chỉnh sửa Checklist:** `components/todo/ChecklistEditor.tsx`
- **Thanh tiến độ Subtasks:** `components/todo/ChecklistProgress.tsx`

### 3.5. Recurring Tasks & Pomodoro Timer
- **Chọn chu kỳ lặp:** `components/todo/RecurrencePicker.tsx`
- **Tính toán RRule:** `lib/recurrence.ts`
- **Floating Pomodoro Widget:** `components/widget/PomodoroTimer.tsx`
- **Hook Pomodoro State Machine:** `hooks/usePomodoro.ts`
- **Mutation tăng Pomodoro:** `useIncrementPomodoro()` trong `hooks/useTodos.ts`

### 3.6. Bulk Actions
- **Hook lựa chọn:** `hooks/useBulkSelect.ts`
- **Thanh thao tác nổi:** `components/todo/BulkActionBar.tsx`

### 3.7. Views: Kanban, Calendar, Focus
- **Kanban Board:** `app/dashboard/board/page.tsx` ➔ `components/kanban/KanbanBoard.tsx`, `KanbanColumn.tsx`, `KanbanCard.tsx`
- **Calendar View:** `app/dashboard/calendar/page.tsx` ➔ `components/calendar/CalendarGrid.tsx`, `WeekStrip.tsx`, `CalendarDayModal.tsx`
- **Focus Mode:** `app/dashboard/focus/page.tsx` ➔ `components/focus/FocusTask.tsx`

### 3.8. Task Templates
- **Picker Chọn Template:** `components/todo/TemplatePicker.tsx`
- **Hook Templates CRUD:** `hooks/useTaskTemplates.ts`
- **Trang Cài đặt Templates:** `app/dashboard/settings/templates/page.tsx`

### 3.9. NLP Date, Export/Import & Shortcuts
- **NLP Date:** `lib/nlpDate.ts` (Chrono node)
- **Export/Import CSV, JSON:** `lib/export.ts` & `lib/import.ts` ➔ `app/dashboard/settings/data/page.tsx`
- **Phím tắt & Command Palette (Ctrl+K):** `hooks/useKeyboardShortcuts.ts`, `components/ui/CommandPalette.tsx`, `components/ui/KeyboardShortcutsModal.tsx`

### 3.10. Layout & Navigation
- **Sidebar:** `components/layout/Sidebar.tsx` — Drawer mobile, cố định desktop. Logout dùng `window.location.href`.
- **Header:** `components/layout/Header.tsx`
- **Navbar:** `components/layout/Navbar.tsx` — Logout dùng `window.location.href`.
- **Dark/Light Mode Toggle:** `components/layout/ThemeToggle.tsx`
- **Dashboard Layout:** `app/dashboard/layout.tsx`
- **Dashboard Template:** `app/dashboard/template.tsx`

### 3.11. Các Trang Dashboard Khác
- **Tasks:** `app/dashboard/tasks/page.tsx`
- **Vital (Overview):** `app/dashboard/vital/page.tsx`
- **Cài đặt Tài khoản:** `app/dashboard/settings/account/page.tsx`
- **Đổi Mật khẩu:** `app/dashboard/settings/password/page.tsx`

### 3.12. UI Components Phụ Trợ (Linear Craft Design System)
- **Toast Notifications:** `components/ui/AppToaster.tsx` (Sonner)
- **Badge:** `components/ui/Badge.tsx`
- **Dropdown Priority:** `components/ui/CustomPrioritySelect.tsx`
- **Modal Chọn Ngày:** `components/ui/DatePickerModal.tsx`
- **Floating Panel:** `components/ui/FloatingPanel.tsx`
- **Upload Ảnh:** `components/ui/ImageUpload.tsx`
- **Intro Splash:** `components/ui/IntroSplash.tsx`
- **Time Wheel Picker:** `components/ui/TimeWheelPicker.tsx`
- **Portal Popover:** `components/ui/PortalPopover.tsx`
- **Motion Presets:** `components/ui/MotionPage.tsx`

### 3.13. UI State Components
- **Empty State:** `components/ui/state/EmptyState.tsx`
- **Error State:** `components/ui/state/ErrorState.tsx`
- **Loading Skeleton:** `components/ui/state/LoadingSkeleton.tsx`
- **Error Boundary Dashboard:** `app/dashboard/error.tsx`
- **Global Error Boundary:** `app/global-error.tsx`

### 3.14. Widgets
- **Lịch Popover Mini:** `components/widget/CalendarPopover.tsx`
- **Thông Báo Popover:** `components/widget/NotificationPopover.tsx`
- **Streak Badge (Realtime):** `components/widget/RealtimeStreakBadge.tsx`
- **Tìm Kiếm Gợi Ý:** `components/widget/SearchAutocomplete.tsx`
- **Đồng Hồ Thế Giới:** `components/widget/WorldClockWidget.tsx`

---

## 4. 🗄️ Cấu Trúc Cơ Sở Dữ Liệu & Migrations

Tất cả bảng đều bật RLS (`auth.uid() = user_id`) và được đánh **B-tree Index** trên `user_id`:

- `todos`: Danh sách công việc chính (hỗ trợ `checklist` JSONB, `sort_order`, `recurrence_rule`, `pomodoro_count`, `deleted_at`)
- `profiles`: Thông tin người dùng (`display_name`, `avatar_url`)
- `categories`: Danh mục công việc (`name`, `color`)
- `tags`: Thẻ đánh dấu (`name`, `color`)
- `todo_tags`: Bảng liên kết n-n giữa todos và tags
- `task_templates`: Mẫu công việc chuẩn bị sẵn (`template_data` JSONB)

Các SQL Migration nằm trong `supabase/migrations/`:
- `20260801000000_init_schema.sql` (bảng `todos`, `profiles`, RLS, triggers)
- `20260801000001_v6_categories_and_attachments.sql` (bảng `categories`, storage buckets)
- `20260802000000_v7_task_images_storage.sql` (Storage buckets cho ảnh đính kèm task)
- `20260807000000_sprint2_schema.sql` (bảng `tags`, `todo_tags`, `task_templates`, `recurrence_rule`)
- `20260808000000_add_user_id_indexes.sql` (B-tree Indexes tối ưu tốc độ RLS)

---

## 5. 🧪 Quy Trình Xác Minh & Lệnh Cần Chạy Trước Khi Hoàn Thành

Sau mỗi lần sửa đổi code, **bắt buộc** phải chạy 2 lệnh sau để đảm bảo 0 lỗi:

```bash
# 1. Kiểm tra kiểu dữ liệu TypeScript (Phải ra 0 lỗi)
npx tsc --noEmit

# 2. Biên dịch thử Production Build Next.js
npm run build
```
