# 🌊 Flow State — Fluid Productivity & Task Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit_Tests-FCC72B?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions)](https://github.com/features/actions)
[![License MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**Flow State** is a modern task management, note-taking, and productivity suite engineered with the **Linear Craft Design System**, fluid micro-interactions, optimistic updates, and real-time database synchronization. Designed for deep work and high cognitive focus, it combines intuitive UX with a zero-trust defense-in-depth architecture guarded by PostgreSQL Row Level Security (RLS) and dynamic Content Security Policy (CSP).

---

## ✨ Key Features

### 🎯 1. Vital Task Management & Focus Dashboard
- **Cognitive Focus Dashboard**: High-level overview of active workflows, progress metrics, and actionable items.
- **Vital Tasks Filter**: Priority filter automatically highlighting `High` severity and urgent tasks.
- **Optimistic UI Updates**: Task toggles, creation, and edits reflect instantly on the UI before asynchronous server synchronization.
- **30-Day Soft Delete & Recovery**: Dedicated trash bin supporting temporary archiving, one-click restoration, or permanent purge.

### 📝 2. Rich Text Notes Engine (TipTap / ProseMirror)
- **WYSIWYG Editing**: Paragraphs, headings, code blocks, checklists, and highlight markers.
- **Unidirectional Ref-Buffered Autosave**: Zero stale closures, debounced auto-save with multi-tab `BroadcastChannel` synchronization.
- **Defense-in-Depth Sanitization**: DOMPurify + JSDOM server-side HTML stripping paired with strict client whitelisting.

### 🏷️ 3. Real-Time Category & Tag Engine
- Custom category creation with dynamic hex color palettes.
- **Supabase Realtime Sync**: User-scoped live channels (`todos-realtime-${userId}`, `notes-realtime-${userId}`) updating metadata across devices simultaneously without polling.

### 🔍 4. Intelligent Search Autocomplete
- **Diacritic-Insensitive Search**: Fast search across task titles and notes with PostgREST query escaping.
- **Full Keyboard Navigation**: Seamless traversal using `🠗`, `🠕`, `Enter`, and `Esc` hotkeys.
- Dynamic keyword highlighting with regex injection safety.

### 📅 5. Embedded Calendar & Kanban Views
- Compact calendar widget directly integrated into the action toolbar.
- Color-coded priority indicator dots representing daily task distribution.
- Interactive Kanban board with drag-and-drop column organization.

### 🛡️ 6. Hardened Security Architecture
- **Supabase Auth & Deny-by-Default RLS**: Row Level Security enforced at the PostgreSQL layer ensuring tenant data isolation (`auth.uid() = user_id`).
- **CSRF Protection & POST-Only Logout**: Double-submit CSRF tokens with constant-time verification preventing prefetch logouts.
- **Per-Request Dynamic Nonce CSP**: Strict CSP headers with cryptographic nonces for script execution.
- **In-Memory Rate Limiting**: Sliding window rate limiting protecting sensitive API endpoints.

---

## 🛠️ Tech Stack

| Layer | Technology & Libraries |
| :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router + Turbopack) |
| **UI Library** | React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 + Linear Craft Design System |
| **Rich Text Editor** | TipTap 3 (StarterKit, Highlight, TaskList) |
| **Backend & Database** | Supabase (PostgreSQL + RLS + Realtime Engine) |
| **Authentication** | Supabase Auth (Email/Password + Session Cookies + Remember-Me) |
| **State & Cache** | TanStack React Query v5 |
| **Service Layer** | Pure TypeScript DB services (`todoService`, `noteService`, `recurrenceService`) |
| **Validation** | Zod v4 (Strict type schemas) |
| **Testing** | Vitest + JSDOM |
| **CI/CD Pipeline** | GitHub Actions (Node.js 22 LTS, Type-checking, Lint, Unit Tests & Build) |

---

## 📁 Project Structure

```text
Flow State/
├── .github/workflows/      # CI/CD Pipeline configurations (GitHub Actions)
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication routes (Login / Signup)
│   ├── api/                # API Route Handlers (notes/sync with withAuth)
│   ├── auth/               # Logout & OAuth callback handlers
│   ├── dashboard/          # Core authenticated application
│   │   ├── board/          # Kanban board
│   │   ├── calendar/       # Calendar view
│   │   ├── categories/     # Category management
│   │   ├── focus/          # Focus timer
│   │   ├── notes/          # Rich text notes
│   │   ├── settings/       # Account, password, templates, export/import
│   │   ├── tasks/          # Complete task ledger
│   │   ├── vital/          # High-priority vital tasks
│   │   └── page.tsx        # Main focus dashboard
│   ├── globals.css         # Linear Craft design tokens
│   └── layout.tsx          # Root Layout & Theme Provider (Nonce Passthrough)
├── components/             # Reusable UI Components (auth, layout, todo, notes, widget)
├── hooks/                  # Custom React Query Hooks (useTodos, useNotes, useAuth)
├── lib/                    # Core Libraries & Services
│   ├── api/                # withAuth route wrapper
│   ├── auth/               # performLogout client helper
│   ├── sanitize/           # serverSanitize (DOMPurify + JSDOM)
│   ├── security/           # csrf, csp, rateLimit
│   ├── services/           # todoService, noteService, recurrenceService
│   ├── supabase/           # Client, Server Factory, Middleware
│   ├── validations/        # Zod schemas (todo, note, category, auth)
│   ├── env.ts              # Typed environment accessor
│   ├── errors.ts           # Typed operational error taxonomy
│   └── logger.ts           # Redacted structured logger
├── supabase/migrations/    # Database SQL Migrations & RLS Policies
├── tests/unit/             # Vitest Unit Test Suites
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ or 22+
- `pnpm` 11.x (`corepack enable pnpm`)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/flow-state.git
cd flow-state
pnpm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and add your Supabase credentials:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Run Tests & Quality Gates
```bash
pnpm test          # Run Vitest unit tests
pnpm exec tsc --noEmit # TypeScript type check
pnpm lint          # ESLint check
pnpm run build     # Verify Next.js production build
```
