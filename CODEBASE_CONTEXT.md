# 🧭 Codebase Context & Instant Lookup Guide — Flow State

> **Dành cho AI Agent & Developer:** Tài liệu này bản đồ hóa toàn bộ kiến trúc, luồng xử lý và vị trí chính xác của từng tính năng trong dự án **Flow State**. Khi cần sửa hay thêm tính năng, chỉ cần tra cứu file tương ứng trong bản đồ bên dưới mà không cần đọc lại toàn bộ codebase.

---

## 1. 🛠️ Tech Stack & Quy Tắc Cốt Lõi

| Thành phần | Công nghệ / Thư viện | Ghi chú kiến trúc |
|---|---|---|
| **Framework** | Next.js 16.2 (App Router, Turbopack) + React 19 | Server Component mặc định, Client Component dùng `'use client'` |
| **Backend & Auth** | Supabase Postgres + Auth + Realtime + Storage | Dùng `@supabase/ssr` (`createBrowserClient` & `createServerClient`) |
| **State Management** | TanStack React Query v5 | Quản lý Server State, caching & Optimistic UI Updates |
| **Styling & Motion** | Tailwind CSS v4 + Framer Motion | Glassmorphism UI, Dark mode, micro-animations |
| **Form & Validation** | Zod + React Hook Form | Input sanitization qua `lib/sanitize.ts` trước khi gửi Supabase |

---

## 2. 🔐 Kiến Trúc Auth & Vòng Đời Cookie (CỰC KỲ QUAN TRỌNG)

- **Client Supabase Client ([`lib/supabase/client.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/lib/supabase/client.ts)):**
  - Ghi đè trực tiếp callback `cookies: { getAll, setAll }` trong `createBrowserClient` để bypass bug `cookieOptions` của `@supabase/ssr`.
  - Đọc động cookie `sb-remember-me`: nếu `true` ➔ cookie hạn 30 ngày (`maxAge: 2592000`), nếu `false` ➔ **Session Cookie** (`maxAge: undefined`).
  - Chứa helper `parseDocumentCookies()` với `safeDecode()` (mã hóa/giải mã đối xứng 100%).
- **Middleware Guard ([`middleware.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/middleware.ts) & [`lib/supabase/middleware.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/lib/supabase/middleware.ts)):**
  - Tự động bảo vệ tất cả tuyến đường `/dashboard/*` ➔ redirect chưa auth về `/login`.
  - Tự động redirect người dùng đã đăng nhập từ `/login` & `/signup` vào `/dashboard`.
  - Sinh ngẫu nhiên dynamic `nonce` per-request nhúng vào **Content-Security-Policy (CSP)** header.
- **Server SignOut ([`app/auth/logout/route.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/app/auth/logout/route.ts)):**
  - Thực hiện `supabase.auth.signOut({ scope: 'global' })` và xóa sạch tất cả cookie `sb-*` bằng `maxAge: 0`.

---

## 3. 🗺️ Bản Đồ Vị Trí Tính Năng (Instant File Lookup)

Khi cần sửa đổi hoặc mở rộng tính năng, tra cứu ngay file mã nguồn tương ứng:

### 3.1. Quản Lý To-do Core (List, Item, Form, Formats)
- **Tạo To-do & Form:** [`components/todo/TodoForm.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/TodoForm.tsx)
- **Danh sách To-do Main:** [`components/todo/TodoList.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/TodoList.tsx)
- **Item To-do Đơn:** [`components/todo/TodoItem.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/TodoItem.tsx)
- **Chi tiết To-do Slide-over:** [`components/todo/TaskDetailView.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/TaskDetailView.tsx)
- **Modal Chỉnh sửa To-do:** [`components/todo/EditTodoModal.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/EditTodoModal.tsx)
- **Hooks Mutations & Queries:** [`hooks/useTodos.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/hooks/useTodos.ts) (CRUD, Trash, Optimistic updates)

### 3.2. Drag & Drop Reorder (Kéo thả sắp xếp)
- **DnD Context Wrapper:** [`components/todo/TodoList.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/TodoList.tsx) (`DndContext` + `SortableContext`)
- **Sortable Item Wrapper:** [`components/todo/SortableTodoItem.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/SortableTodoItem.tsx)
- **Reorder Mutation:** `useReorderTodos()` trong [`hooks/useTodos.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/hooks/useTodos.ts)

### 3.3. Thẻ Tags & Danh Mục (Categories)
- **Picker Thẻ Tag:** [`components/ui/TagPicker.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/ui/TagPicker.tsx) (Tạo mới + Chọn nhanh từ Categories)
- **Badges Thẻ Tag:** [`components/todo/TagBadges.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/TagBadges.tsx)
- **Picker Danh Mục:** [`components/ui/CustomCategorySelect.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/ui/CustomCategorySelect.tsx)
- **Trang Quản lý Danh mục:** [`app/dashboard/categories/page.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/app/dashboard/categories/page.tsx)
- **Hooks:** [`hooks/useTags.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/hooks/useTags.ts) & [`hooks/useCategories.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/hooks/useCategories.ts)

### 3.4. Subtasks / Checklist trong To-do
- **Trình chỉnh sửa Checklist:** [`components/todo/ChecklistEditor.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/ChecklistEditor.tsx)
- **Thanh tiến độ Subtasks:** [`components/todo/ChecklistProgress.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/ChecklistProgress.tsx)

### 3.5. Task lặp lại (Recurring Tasks) & Pomodoro Timer
- **Chọn chu kỳ lặp:** [`components/todo/RecurrencePicker.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/RecurrencePicker.tsx)
- **Tính toán RRule:** [`lib/recurrence.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/lib/recurrence.ts)
- **Floating Pomodoro Widget:** [`components/widget/PomodoroTimer.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/widget/PomodoroTimer.tsx)
- **Hook Pomodoro State Machine:** [`hooks/usePomodoro.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/hooks/usePomodoro.ts)
- **Mutation tăng Pomodoro:** `useIncrementPomodoro()` trong [`hooks/useTodos.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/hooks/useTodos.ts)

### 3.6. Thao tác hàng loạt (Bulk Actions)
- **Hook lựa chọn:** [`hooks/useBulkSelect.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/hooks/useBulkSelect.ts)
- **Thanh thao tác nổi:** [`components/todo/BulkActionBar.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/BulkActionBar.tsx)

### 3.7. Các Chế Độ Xem (Views: Kanban, Calendar, Focus)
- **Kanban Board:** [`app/dashboard/board/page.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/app/dashboard/board/page.tsx) ➔ [`components/kanban/KanbanBoard.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/kanban/KanbanBoard.tsx), [`KanbanColumn.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/kanban/KanbanColumn.tsx), [`KanbanCard.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/kanban/KanbanCard.tsx)
- **Calendar View:** [`app/dashboard/calendar/page.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/app/dashboard/calendar/page.tsx) ➔ [`components/calendar/CalendarGrid.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/calendar/CalendarGrid.tsx), [`WeekStrip.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/calendar/WeekStrip.tsx), [`CalendarDayModal.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/calendar/CalendarDayModal.tsx)
- **Focus Mode:** [`app/dashboard/focus/page.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/app/dashboard/focus/page.tsx) ➔ [`components/focus/FocusTask.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/focus/FocusTask.tsx)

### 3.8. Mẫu Công Việc (Task Templates)
- **Picker Chọn Template:** [`components/todo/TemplatePicker.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/todo/TemplatePicker.tsx)
- **Hook Templates CRUD:** [`hooks/useTaskTemplates.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/hooks/useTaskTemplates.ts)
- **Trang Cài đặt Templates:** [`app/dashboard/settings/templates/page.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/app/dashboard/settings/templates/page.tsx)

### 3.9. NLP Date, Export/Import & Phím Tắt (Shortcuts)
- **Phân tích Ngôn ngữ tự nhiên (NLP Date):** [`lib/nlpDate.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/lib/nlpDate.ts) (Chrono node)
- **Xuất / Nhập Dữ liệu (CSV, JSON):** [`lib/export.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/lib/export.ts) & [`lib/import.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/lib/import.ts) ➔ [`app/dashboard/settings/data/page.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/app/dashboard/settings/data/page.tsx)
- **Phím tắt & Command Palette (Ctrl+K):** [`hooks/useKeyboardShortcuts.ts`](file:///e:/luyentaphe/portfolio/Flow%20State/hooks/useKeyboardShortcuts.ts), [`components/ui/CommandPalette.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/ui/CommandPalette.tsx), [`KeyboardShortcutsModal.tsx`](file:///e:/luyentaphe/portfolio/Flow%20State/components/ui/KeyboardShortcutsModal.tsx)

---

## 4. 🗄️ Cấu Trúc Cơ Sở Dữ Liệu & Migrations

Tất cả bảng đều bật RLS (`auth.uid() = user_id`) và được đánh **B-tree Index** trên `user_id`:

- `todos`: Danh sách công việc chính (hỗ trợ `checklist` JSONB, `sort_order`, `recurrence_rule`, `pomodoro_count`, `deleted_at`)
- `profiles`: Thông tin người dùng (`display_name`, `avatar_url`)
- `categories`: Danh mục công việc (`name`, `color`)
- `tags`: Thẻ đánh dấu (`name`, `color`)
- `todo_tags`: Bảng liên kết n-n giữa todos và tags
- `task_templates`: Mẫu công việc chuẩn bị sẵn (`template_data` JSONB)

Các SQL Migration nằm trong [`supabase/migrations/`](file:///e:/luyentaphe/portfolio/Flow%20State/supabase/migrations/):
- `20260801000000_init_schema.sql` (bảng `todos`, `profiles`, RLS, triggers)
- `20260801000001_v6_categories_and_attachments.sql` (bảng `categories`, storage buckets)
- `20260807000000_sprint2_schema.sql` (bảng `tags`, `todo_tags`, `task_templates`, `recurrence_rule`)
- `20260808000000_add_user_id_indexes.sql` (B-tree Indexes tối ưu tốc độ RLS)

---

## 5. ✅ Quy Trình Xác Minh & Lệnh Cần Chạy Trước Khi Commit

Sau mỗi lần sửa đổi code, **bắt buộc** phải chạy 2 lệnh sau để đảm bảo 0 lỗi:

```bash
# 1. Kiểm tra kiểu dữ liệu TypeScript (Phải ra 0 lỗi)
npx tsc --noEmit

# 2. Biên dịch thử Production Build Next.js
npm run build
```
