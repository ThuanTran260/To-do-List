# 🌊 Flow State — Fluid Productivity & Task Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions)](https://github.com/features/actions)
[![License MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**Flow State** is a modern task management and productivity suite engineered with a sleek **Glassmorphism** visual language, fluid micro-interactions, optimistic updates, and real-time database synchronization. Designed for deep work and high cognitive focus, it combines intuitive UX with a zero-trust security architecture guarded by PostgreSQL Row Level Security (RLS).

---

## ✨ Key Features

### 🎯 1. Vital Task Management & Focus Dashboard
- **Cognitive Focus Dashboard**: High-level overview of active workflows, progress metrics, and actionable items.
- **Vital Tasks Filter**: Priority filter automatically highlighting `High` severity and starred urgent tasks.
- **Optimistic UI Updates**: Task toggles, creation, and edits reflect instantly on the UI before asynchronous server synchronization.
- **30-Day Soft Delete & Recovery**: Dedicated trash bin supporting temporary archiving, one-click restoration, or permanent purge.

### 🏷️ 2. Real-Time Category Engine
- Custom category creation with dynamic hex color palettes.
- **Supabase Realtime Sync**: Bi-directional live synchronization updating category metadata across multiple devices simultaneously without full page reloads.

### 🔍 3. Intelligent Search Autocomplete
- **Diacritic-Insensitive Search**: Fast fuzzy search across task titles and notes.
- **Full Keyboard Navigation**: Seamless traversal using `🠗`, `🠕`, `Enter`, and `Esc` hotkeys.
- Dynamic keyword highlighting with regex injection safety.

### 📅 4. Embedded Calendar Popover
- Compact calendar widget directly integrated into the action toolbar.
- Color-coded priority indicator dots representing daily task distribution.
- Instant task creation and deadline assignment directly from the selected date.

### 🔔 5. Proactive Notification Center
- Real-time alerts categorizing tasks into **Overdue**, **Due Within 24h**, and **Vital Attention**.
- Inline quick-actions (Mark as Complete, Dismiss) with undoable toast notifications.

### 🛡️ 6. Security Architecture & User Profile
- **Supabase Auth & Deny-by-Default RLS**: Row Level Security enforced at the PostgreSQL layer ensuring total tenant data isolation (`auth.uid() = user_id`).
- **Profile & Avatar Management**: User avatar uploads with client-side image compression and safe storage.
- **XSS Sanitization & Security Headers**: Zero-dependency input sanitization paired with strict Content Security Policy (CSP) headers.

### 🌗 7. Glassmorphic Design System & Dark Mode
- Seamless tri-mode theme switcher: `Light Mode`, `Dark Mode`, and `System Default`.
- Premium Indigo/Purple frosted glass UI with smooth backdrop-filter blur effects.

---

## 🛠️ Tech Stack

| Layer | Technology & Libraries |
| :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router + Turbopack) |
| **UI Library** | React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 + Custom Glassmorphism Design System |
| **Icon Set** | Lucide React |
| **Backend & Database** | Supabase (PostgreSQL + RLS + Realtime Engine) |
| **Authentication** | Supabase Auth (Email/Password & Session Cookies) |
| **State & Cache** | TanStack React Query v5 |
| **Validation & Security** | Zod + Custom HTML Sanitizer |
| **CI/CD Pipeline** | GitHub Actions (Node.js 22 LTS, Type-checking & Production Build) |

---

## 📁 Project Structure

```text
Flow State/
├── .github/workflows/      # CI/CD Pipeline configurations (GitHub Actions)
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication routes (Login / Signup)
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/          # Core authenticated application
│   │   ├── categories/     # Category management
│   │   ├── settings/       # Account & password settings
│   │   ├── tasks/          # Complete task ledger
│   │   ├── vital/          # High-priority vital tasks
│   │   └── page.tsx        # Main focus dashboard
│   ├── globals.css         # Custom Glassmorphic design tokens
│   └── layout.tsx          # Root Layout & Theme Provider
├── components/             # Reusable UI Components
│   ├── auth/               # Auth form controllers
│   ├── layout/             # Header, Sidebar, Navbar, ThemeToggle
│   ├── todo/               # TodoForm, TodoList, TodoItem, TrashModal
│   ├── ui/                 # Modal, Badge, FloatingPanel, Skeleton Loaders
│   └── widget/             # SearchAutocomplete, CalendarPopover, NotificationPopover
├── hooks/                  # Custom React Hooks (useTodos, useCategories, useAuth)
├── lib/                    # Supabase Client/Server, Zod Schemas, Sanitizer, Logger
├── supabase/               # Database SQL Migrations & RLS Policies
├── proxy.ts                # Next.js Middleware Security Headers & Auth Guard
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v22.0.0` or higher
- **npm** or **pnpm**

### 2. Clone & Install
```bash
git clone https://github.com/ThuanTran260/To-do-List.git
cd "Flow State"
npm install
```

### 3. Environment Variables (`.env.local`)
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 5. Verification & Build
```bash
# Type check with TypeScript compiler
npx tsc --noEmit

# Lint code quality
npm run lint

# Production build
npm run build
```

---

## 🔒 Security & Defense Architecture

The platform strictly adheres to **Zero-Trust Frontend** principles:
- **Row Level Security (RLS):** Every PostgreSQL table (`todos`, `categories`) enforces RLS policies scoping every query to `auth.uid() = user_id`.
- **Public vs. Private Secret Isolation:** Only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is exposed client-side. Privileged keys are never leaked to browser bundles.
- **XSS & Injection Protection:** User inputs are sanitized prior to storage, guarded by comprehensive HTTP security headers (CSP, X-Frame-Options DENY, SameSite Cookie policies).

---

## 📄 License

Distributed under the [MIT License](LICENSE).

<div align="center">
  <sub>Developed with ❤️ by Tran Thuan • Software Engineering Portfolio</sub>
</div>
