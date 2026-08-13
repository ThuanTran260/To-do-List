# ?? Codebase Context & Instant Lookup Guide � Flow State

> **D�nh cho AI Agent & Developer:** T�i li?u n�y b?n d? h�a to�n b? ki?n tr�c, lu?ng x? l� v� v? tr� ch�nh x�c c?a t?ng t�nh nang trong d? �n **Flow State**. Khi c?n s?a hay th�m t�nh nang, ch? c?n tra c?u file tuong ?ng trong b?n d? b�n du?i m� kh�ng c?n d?c l?i to�n b? codebase.

---

## 1. ??? Tech Stack & Quy T?c C?t L�i

| Th�nh ph?n | C�ng ngh? / Thu vi?n | Ghi ch� ki?n tr�c |
|---|---|---|
| **Framework** | Next.js 16.2 (App Router, Turbopack) + React 19 | Server Component m?c d?nh, Client Component d�ng `''use client''` |
| **Backend & Auth** | Supabase Postgres + Auth + Realtime + Storage | D�ng `@supabase/ssr` (`createBrowserClient` & `createServerClient`) |
| **State Management** | TanStack React Query v5 | Qu?n l� Server State, caching & Optimistic UI Updates |
| **Styling & Motion** | Tailwind CSS v4 + Framer Motion | Glassmorphism UI, Dark mode, micro-animations |
| **Form & Validation** | Zod + React Hook Form | Input sanitization qua `lib/sanitize.ts` tru?c khi g?i Supabase |

---

## 2. ?? Ki?n Tr�c Auth & V�ng �?i Cookie (C?C K? QUAN TR?NG)

- **Client Supabase Client (`lib/supabase/client.ts`):**
  - Ghi d� tr?c ti?p callback `cookies: { getAll, setAll }` trong `createBrowserClient` d? bypass bug `cookieOptions` c?a `@supabase/ssr`.
  - �?c d?ng cookie `sb-remember-me`: n?u `true` ? cookie h?n 30 ng�y (`maxAge: 2592000`), n?u `false` ? **Session Cookie** (`maxAge: undefined`).
  - Ch?a helper `parseDocumentCookies()` v?i `safeDecode()` (m� h�a/gi?i m� d?i x?ng 100%).
- **Proxy Guard (`proxy.ts` ? `lib/supabase/proxy.ts`):**
  - `proxy.ts` ? thu m?c g?c l� entry point duy nh?t (chu?n Vercel Edge Runtime).
  - T? d?ng b?o v? t?t c? tuy?n du?ng `/dashboard/*` ? redirect chua auth v? `/login`.
  - T? d?ng redirect ngu?i d�ng d� dang nh?p t? `/login` & `/signup` v�o `/dashboard`.
  - Sinh ng?u nhi�n dynamic `nonce` per-request nh�ng v�o **Content-Security-Policy (CSP)** header.
- **Server SignOut (`app/auth/logout/route.ts`):**
  - Th?c hi?n `supabase.auth.signOut({ scope: ''global'' })` v� x�a s?ch t?t c? cookie `sb-*` b?ng `maxAge: 0`.
  - ?? **QUAN TR?NG - Prefetch Pitfall:** Route n�y x? l� `GET` request � TUY?T �?I KH�NG d�ng `<Link href="/auth/logout">` v� Next.js s? ng?m prefetch v� k�ch ho?t dang xu?t ngay khi n�t xu?t hi?n tr�n m�n h�nh. Ph?i d�ng `<a href="/auth/logout">` ho?c `window.location.href`. Xem chi ti?t: `NEXTJS_PREFETCH_BUG_REPORT.md`.
- **OAuth Callback (`app/auth/callback/route.ts`):**
  - X? l� redirect sau khi ngu?i d�ng x�c nh?n email ho?c dang nh?p OAuth.

---

## 3. ??? B?n �? V? Tr� T�nh Nang (Instant File Lookup)

### 3.1. Qu?n L� To-do Core
- **T?o To-do & Form:** `components/todo/TodoForm.tsx`
- **Danh s�ch To-do Main:** `components/todo/TodoList.tsx`
- **Item To-do �on:** `components/todo/TodoItem.tsx`
- **Chi ti?t To-do Slide-over:** `components/todo/TaskDetailView.tsx`
- **Modal Ch?nh s?a To-do:** `components/todo/EditTodoModal.tsx`
- **Th�ng R�c (Soft Delete):** `components/todo/TrashModal.tsx`
- **Thanh L?c Danh M?c:** `components/todo/CategoryFilterBar.tsx`
- **Th? Th?ng K�:** `components/todo/InsightsCard.tsx`
- **Hooks Mutations & Queries:** `hooks/useTodos.ts` (CRUD, Trash, Optimistic updates)

### 3.2. Drag & Drop Reorder
- **DnD Context Wrapper:** `components/todo/TodoList.tsx` (`DndContext` + `SortableContext`)
- **Sortable Item Wrapper:** `components/todo/SortableTodoItem.tsx`
- **Reorder Mutation:** `useReorderTodos()` trong `hooks/useTodos.ts`

### 3.3. Tags & Categories
- **Picker Th? Tag:** `components/ui/TagPicker.tsx`
- **Badges Th? Tag:** `components/todo/TagBadges.tsx`
- **Picker Danh M?c:** `components/ui/CustomCategorySelect.tsx`
- **Trang Qu?n l� Danh m?c:** `app/dashboard/categories/page.tsx`
- **Hooks:** `hooks/useTags.ts` & `hooks/useCategories.ts`

### 3.4. Subtasks / Checklist
- **Tr�nh ch?nh s?a Checklist:** `components/todo/ChecklistEditor.tsx`
- **Thanh ti?n d? Subtasks:** `components/todo/ChecklistProgress.tsx`

### 3.5. Recurring Tasks & Pomodoro Timer
- **Ch?n chu k? l?p:** `components/todo/RecurrencePicker.tsx`
- **T�nh to�n RRule:** `lib/recurrence.ts`
- **Floating Pomodoro Widget:** `components/widget/PomodoroTimer.tsx`
- **Hook Pomodoro State Machine:** `hooks/usePomodoro.ts`
- **Mutation tang Pomodoro:** `useIncrementPomodoro()` trong `hooks/useTodos.ts`

### 3.6. Bulk Actions
- **Hook l?a ch?n:** `hooks/useBulkSelect.ts`
- **Thanh thao t�c n?i:** `components/todo/BulkActionBar.tsx`

### 3.7. Views: Kanban, Calendar, Focus
- **Kanban Board:** `app/dashboard/board/page.tsx` ? `components/kanban/KanbanBoard.tsx`, `KanbanColumn.tsx`, `KanbanCard.tsx`
- **Calendar View:** `app/dashboard/calendar/page.tsx` ? `components/calendar/CalendarGrid.tsx`, `WeekStrip.tsx`, `CalendarDayModal.tsx`
- **Focus Mode:** `app/dashboard/focus/page.tsx` ? `components/focus/FocusTask.tsx`

### 3.8. Task Templates
- **Picker Ch?n Template:** `components/todo/TemplatePicker.tsx`
- **Hook Templates CRUD:** `hooks/useTaskTemplates.ts`
- **Trang C�i d?t Templates:** `app/dashboard/settings/templates/page.tsx`

### 3.9. NLP Date, Export/Import & Shortcuts
- **NLP Date:** `lib/nlpDate.ts` (Chrono node)
- **Export/Import CSV, JSON:** `lib/export.ts` & `lib/import.ts` ? `app/dashboard/settings/data/page.tsx`
- **Ph�m t?t & Command Palette (Ctrl+K):** `hooks/useKeyboardShortcuts.ts`, `components/ui/CommandPalette.tsx`, `components/ui/KeyboardShortcutsModal.tsx`

### 3.10. Layout & Navigation
- **Sidebar:** `components/layout/Sidebar.tsx` � Drawer mobile, c? d?nh desktop. Logout d�ng `window.location.href`.
- **Header:** `components/layout/Header.tsx`
- **Navbar:** `components/layout/Navbar.tsx` � Logout d�ng `window.location.href`.
- **Dark/Light Mode Toggle:** `components/layout/ThemeToggle.tsx`
- **Dashboard Layout:** `app/dashboard/layout.tsx`
- **Dashboard Template:** `app/dashboard/template.tsx`

### 3.11. C�c Trang Dashboard Kh�c
- **Tasks:** `app/dashboard/tasks/page.tsx`
- **Vital (Overview):** `app/dashboard/vital/page.tsx`
- **C�i d?t T�i kho?n:** `app/dashboard/settings/account/page.tsx`
- **�?i M?t kh?u:** `app/dashboard/settings/password/page.tsx`

### 3.12. UI Components Ph? Tr?
- **Toast Notifications:** `components/ui/AppToaster.tsx` (Sonner)
- **Badge:** `components/ui/Badge.tsx`
- **Dropdown Priority:** `components/ui/CustomPrioritySelect.tsx`
- **Modal Ch?n Ng�y:** `components/ui/DatePickerModal.tsx`
- **Floating Panel:** `components/ui/FloatingPanel.tsx`
- **Upload ?nh:** `components/ui/ImageUpload.tsx`
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
- **L?ch Popover Mini:** `components/widget/CalendarPopover.tsx`
- **Th�ng B�o Popover:** `components/widget/NotificationPopover.tsx`
- **Streak Badge (Realtime):** `components/widget/RealtimeStreakBadge.tsx`
- **T�m Ki?m G?i �:** `components/widget/SearchAutocomplete.tsx`
- **�?ng H? Th? Gi?i:** `components/widget/WorldClockWidget.tsx`

### 3.15. Hooks B? Sung
- **Auth State:** `hooks/useAuth.ts`
- **Realtime Todos:** `hooks/useRealtimeTodos.ts` � L?ng nghe Supabase Realtime channel
- **Dropdown Manager:** `hooks/useDropdownManager.tsx`
- **Wheel Year Scroll:** `hooks/useWheelYearScroll.ts`

### 3.16. Lib Modules B? Sung
- **Error Handling:** `lib/errors.ts`
- **Logging System:** `lib/logger.ts`
- **Framer Motion Presets:** `lib/motion.ts`
- **Offline Queue:** `lib/offlineQueue.ts`
- **Supabase Storage Helpers:** `lib/storage.ts`

---

## 4. ??? C?u Tr�c Co S? D? Li?u & Migrations

T?t c? b?ng d?u b?t RLS (`auth.uid() = user_id`) v� du?c d�nh **B-tree Index** tr�n `user_id`:

- `todos`: Danh s�ch c�ng vi?c ch�nh (h? tr? `checklist` JSONB, `sort_order`, `recurrence_rule`, `pomodoro_count`, `deleted_at`)
- `profiles`: Th�ng tin ngu?i d�ng (`display_name`, `avatar_url`)
- `categories`: Danh m?c c�ng vi?c (`name`, `color`)
- `tags`: Th? d�nh d?u (`name`, `color`)
- `todo_tags`: B?ng li�n k?t n-n gi?a todos v� tags
- `task_templates`: M?u c�ng vi?c chu?n b? s?n (`template_data` JSONB)

C�c SQL Migration n?m trong `supabase/migrations/`:
- `20260801000000_init_schema.sql` (b?ng `todos`, `profiles`, RLS, triggers)
- `20260801000001_v6_categories_and_attachments.sql` (b?ng `categories`, storage buckets)
- `20260802000000_v7_task_images_storage.sql` (Storage buckets cho ?nh d�nh k�m task)
- `20260807000000_sprint2_schema.sql` (b?ng `tags`, `todo_tags`, `task_templates`, `recurrence_rule`)
- `20260808000000_add_user_id_indexes.sql` (B-tree Indexes t?i uu t?c d? RLS)

---

## 5. ? Quy Tr�nh X�c Minh & L?nh C?n Ch?y Tru?c Khi Commit

Sau m?i l?n s?a d?i code, **b?t bu?c** ph?i ch?y 2 l?nh sau d? d?m b?o 0 l?i:

```bash
# 1. Ki?m tra ki?u d? li?u TypeScript (Ph?i ra 0 l?i)
npx tsc --noEmit

# 2. Bi�n d?ch th? Production Build Next.js
npm run build
```

---

## 6. ?? Known Pitfalls & Anti-Patterns

Danh s�ch c�c l?i d� x?y ra th?c t? trong d? �n � **KH�NG L?P L?I**.

### 6.1. Next.js `<Link>` Prefetch k�ch ho?t Route c� Side-Effect

**Tri?u ch?ng:** �ang nh?p th�nh c�ng nhung l?p t?c b? vang ra trang Login. Console b�o `403 - session_not_found`.

**Nguy�n nh�n:** `<Link href="/auth/logout">` khi?n Next.js ng?m g?i GET request t?i route logout ngay khi n�t xu?t hi?n tr�n m�n h�nh, x�a session tru?c khi redirect v? `/dashboard`.

**Quy t?c v�ng:**
```tsx
// SAI � Next.js prefetch s? g?i ng?m route n�y
<Link href="/auth/logout">�ang xu?t</Link>

// ��NG � <a> kh�ng b? prefetch
<a href="/auth/logout">�ang xu?t</a>

// ��NG � Programmatic navigation
<button onClick={() => window.location.href = ''/auth/logout''}>�ang xu?t</button>
```

**�p d?ng cho:** B?t k? route n�o th?c thi side-effect khi nh?n `GET` request (logout, delete, confirm...).
**Chi ti?t d?y d?:** `NEXTJS_PREFETCH_BUG_REPORT.md`

### 6.2. Supabase `setAll` ghi d� Response v� m?t Security Headers

**Tri?u ch?ng:** CSP, HSTS, X-Frame-Options headers b? m?t tr�n m?t s? response.

**Nguy�n nh�n:** Trong `createServerClient`, callback `setAll` t?o `NextResponse.next({ request })` m?i l�m m?t to�n b? headers d� set tru?c d�.

**Quy t?c v�ng:** Trong `lib/supabase/proxy.ts`, ch? g?i `supabaseResponse.cookies.set()` b�n trong `setAll` � kh�ng bao gi? t?o `NextResponse` m?i b�n trong callback.

### 6.3. Middleware kh�ng ho?t d?ng khi d?t sai v? tr�

**Tri?u ch?ng:** Auth guard kh�ng ch?n du?c route `/dashboard/*` tr�n Vercel d� ho?t d?ng t?t tr�n localhost.

**Nguy�n nh�n:** Vercel Edge Runtime ch? nh?n di?n `proxy.ts` ? **thu m?c g?c**. �?t ? thu m?c con d?u b? b? qua tr�n production.

**Quy t?c v�ng:** Entry point middleware LU�N l� `/proxy.ts` ? thu m?c g?c. Logic th?c thi import t? `lib/supabase/proxy.ts`.
