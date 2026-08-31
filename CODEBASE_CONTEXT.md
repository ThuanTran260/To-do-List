# 🗺️ Codebase Context & Instant Lookup Guide — Flow State

> **Dành cho AI Agent & Developer:** Tài liệu này bản đồ hóa toàn bộ kiến trúc, luồng xử lý và vị trí chính xác của từng tính năng trong dự án **Flow State**. Khi cần sửa hay thêm tính năng, chỉ cần tra cứu file tương ứng trong bản đồ bên dưới mà không cần đọc lại toàn bộ codebase.

---

## 1. 🛠️ Tech Stack & Quy Tắc Cốt Lõi

| Thành phần | Công nghệ / Thư viện | Ghi chú kiến trúc |
|---|---|---|
| **Framework** | Next.js 16.2 (App Router, Turbopack) + React 19 | Server Component mặc định, Client Component dùng `'use client'` |
| **Backend & Auth** | Supabase Postgres + Auth + Realtime + Storage | Dùng `@supabase/ssr` (`createBrowserClient` & `createServerClient`) |
| **State Management** | TanStack React Query v5 | Quản lý Server State, caching & Optimistic UI Updates |
| **Service Layer** | `lib/services/` (`todoService`, `noteService`, `recurrenceService`) | Tách biệt hoàn toàn DB queries/mutations khỏi UI hooks |
| **Design System** | **Linear Craft Design System** (Tailwind CSS v4) | Hairline borders (`border-hairline`), Lavender accent (`#5e6ad2`), Surface ladder (`surface-1`, `surface-2`, `surface-3`), 0 AI gradients |
| **Typography & Motion** | Inter + JetBrains Mono + Framer Motion | Tối ưu độ tương phản WCAG AA, micro-animations mượt mà không layout shift |
| **Form & Validation** | Zod + Strict Schemas | Input sanitization qua DOMPurify (`serverSanitize` & `clientSanitize`) |
| **Testing & CI/CD** | Vitest + GitHub Actions (Node.js 22 LTS) | Typecheck (`tsc --noEmit`), Lint (`eslint`), Unit Tests (`vitest run`), Production Build |

---

## 2. 🔐 Kiến Trúc Auth & Vòng Đời Cookie (CỰC KỲ QUAN TRỌNG)

- **Client Supabase Client (`lib/supabase/client.ts`):**
  - Ghi đè trực tiếp callback `cookies: { getAll, setAll }` trong `createBrowserClient` để xử lý cookie nhất quán.
  - Đọc động cookie `sb-remember-me`: nếu `true` ➔ cookie hạn 30 ngày (`maxAge: 2592000`), nếu `false` ➔ **Session Cookie** (`maxAge: undefined`).
  - Chứa helper `parseDocumentCookies()` với `safeDecode()` (mã hóa/giải mã đối xứng 100%).
- **Middleware Guard (`middleware.ts` ➔ `lib/supabase/middleware.ts`):**
  - Tự động bảo vệ tất cả tuyến đường `/dashboard/*` ➔ redirect chưa auth về `/login` (Fail-closed).
  - Tự động redirect người dùng đã đăng nhập từ `/login` & `/signup` vào `/dashboard`.
  - Sinh ngẫu nhiên dynamic `nonce` per-request nhúng vào **Content-Security-Policy (CSP)** header và forward qua request headers cho `app/layout.tsx`.
  - Tự động phát hành `csrf-token` cookie (double-submit pattern).
- **Server SignOut (`app/auth/logout/route.ts` & `lib/auth/logoutClient.ts`):**
  - **POST-only**: Chống CSRF via `<img>`/prefetch (trả 405 nếu gọi GET).
  - Xác thực header `x-csrf-token` khớp với cookie `csrf-token`.
  - Thực hiện `supabase.auth.signOut({ scope: 'global' })` và xóa sạch tất cả cookie `sb-*` bằng `maxAge: 0`.
  - Client gọi qua helper duy nhất `performLogout()` trong `lib/auth/logoutClient.ts`.
- **API Guard (`lib/api/withAuth.ts`):**
  - Wrapper chuẩn cho các route handlers server-side, tự động trích xuất `user` và `supabase` client hoặc trả 401/503 có cấu trúc.
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
- **Service & Hooks:** `lib/services/todoService.ts` ➔ `hooks/useTodos.ts` (CRUD, Trash, Optimistic updates)

### 3.2. Drag & Drop Reorder
- **DnD Context Wrapper:** `components/todo/TodoList.tsx` (`DndContext` + `SortableContext`)
- **Sortable Item Wrapper:** `components/todo/SortableTodoItem.tsx`
- **Reorder Mutation:** `useReorderTodos()` trong `hooks/useTodos.ts` ➔ `reorderTodos()` trong `lib/services/todoService.ts`

### 3.3. Tags & Categories
- **Picker Thẻ Tag:** `components/ui/TagPicker.tsx`
- **Badges Thẻ Tag:** `components/todo/TagBadges.tsx`
- **Picker Danh Mục:** `components/ui/CustomCategorySelect.tsx` (PortalPopover)
- **Trang Quản lý Danh mục:** `app/dashboard/categories/page.tsx`
- **Hooks:** `hooks/useTags.ts` & `hooks/useCategories.ts`

### 3.4. Subtasks / Checklist
- **Trình chỉnh sửa Checklist:** `components/todo/ChecklistEditor.tsx`
- **Thanh tiến độ Subtasks:** `components/todo/ChecklistProgress.tsx`
- **Validation Schema:** `lib/validations/todo.ts` (Strict `checklistItemSchema`)

### 3.5. Recurring Tasks & Pomodoro Timer
- **Chọn chu kỳ lặp:** `components/todo/RecurrencePicker.tsx`
- **Tính toán RRule & Service:** `lib/recurrence.ts` ➔ `lib/services/recurrenceService.ts` (Single-occurrence policy)
- **Floating Pomodoro Widget:** `components/widget/PomodoroTimer.tsx`
- **Hook Pomodoro State Machine:** `hooks/usePomodoro.ts`
- **Mutation tăng Pomodoro:** `useIncrementPomodoro()` trong `hooks/useTodos.ts`

### 3.6. Bulk Actions
- **Hook lựa chọn:** `hooks/useBulkSelect.ts`
- **Thanh thao tác nổi:** `components/todo/BulkActionBar.tsx`
- **Service Batch Ops:** `bulkCompleteTodos`, `bulkDeleteTodos`, `bulkUpdatePriority` trong `lib/services/todoService.ts`

### 3.7. Notes & Rich Text Editor (TipTap)
- **Notes Dashboard & Grid:** `app/dashboard/notes/page.tsx` ➔ `components/notes/NoteCard.tsx`, `NoteFilterBar.tsx`
- **TipTap Rich Text Editor:** `components/notes/NoteEditor.tsx` (ProseMirror AST, Highlight, TaskList)
- **Autosave Engine:** `hooks/useAutosaveNote.ts` (Unidirectional ref-buffered, BroadcastChannel multi-tab sync)
- **Service & Hooks:** `lib/services/noteService.ts` ➔ `hooks/useNotes.ts`
- **Sync API Handler:** `app/api/notes/sync/route.ts` (Server DOMPurify + withAuth + In-memory Rate Limiting)

### 3.8. Views: Kanban, Calendar, Focus
- **Kanban Board:** `app/dashboard/board/page.tsx` ➔ `components/kanban/KanbanBoard.tsx`, `KanbanColumn.tsx`, `KanbanCard.tsx`
- **Calendar View:** `app/dashboard/calendar/page.tsx` ➔ `components/calendar/CalendarGrid.tsx`, `WeekStrip.tsx`, `CalendarDayModal.tsx`
- **Focus Mode:** `app/dashboard/focus/page.tsx` ➔ `components/focus/FocusTask.tsx`

### 3.9. Task Templates
- **Picker Chọn Template:** `components/todo/TemplatePicker.tsx`
- **Hook Templates CRUD:** `hooks/useTaskTemplates.ts`
- **Trang Cài đặt Templates:** `app/dashboard/settings/templates/page.tsx`

### 3.10. NLP Date, Export/Import & Shortcuts
- **NLP Date:** `lib/nlpDate.ts` (Chrono node)
- **Export/Import CSV, JSON:** `lib/export.ts` & `lib/import.ts` (RFC 4180 parser) ➔ `app/dashboard/settings/data/page.tsx`
- **Phím tắt & Command Palette (Ctrl+K):** `hooks/useKeyboardShortcuts.ts`, `components/ui/CommandPalette.tsx`, `components/ui/KeyboardShortcutsModal.tsx`

### 3.11. Layout & Navigation
- **Sidebar:** `components/layout/Sidebar.tsx` — Drawer mobile, cố định desktop. Đăng xuất qua `performLogout()`.
- **Header:** `components/layout/Header.tsx`
- **Navbar:** `components/layout/Navbar.tsx` — Đăng xuất qua `performLogout()`.
- **Dark/Light Mode Toggle:** `components/layout/ThemeToggle.tsx`
- **Dashboard Layout:** `app/dashboard/layout.tsx`

---

## 4. 🧪 Testing & Quality Gates

- **Unit Tests (`pnpm test`):** Vitest + JSDOM môi trường, bao phủ CSRF, CSP, RateLimit, Sanitize, Supabase Client Cookies, Recurrence, Notes Search, CSV Parser, Offline Queue, Env, Errors, Services.
- **Type Checking (`pnpm exec tsc --noEmit`):** TypeScript 5.x Strict Mode 0 lỗi.
- **Linting (`pnpm lint`):** ESLint 9 Flat Config.
- **Production Build (`pnpm run build`):** Next.js 16 App Router Turbopack biên dịch sạch 100%.
