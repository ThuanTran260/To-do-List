# Git workflow rules

- **NEVER run `git push`** (including `git push --force`, `git push -u`, or any variant). Pushing is always done manually by the user. Hard-enforced by `opencode.json` (`permission.bash` denies `git push*`).
- You MAY run `git add`, `git commit`, `git status`, `git diff`, `git log`, and branch operations locally.
- When the user asks to "commit", do exactly that: stage the intended files and commit with a concise message. Then stop and remind the user to run `git push` themselves.

# Slash commands (`/...`)

- This repo defines **zero custom slash commands** — there is no `.opencode/` directory. Only opencode built-in commands exist; never hallucinate project-specific ones (e.g. there is no `/deploy`, `/migrate`, or `/review` here).
- To add one, create `.opencode/command/<name>.md` (Markdown prompt with `$ARGUMENTS` for user input). Restart opencode afterwards — config is loaded once at startup, not hot-reloaded.

# Instruction files — which one, when

| File | Loaded | Role — read it when... |
|---|---|---|
| `AGENTS.md` (this file, repo root) | Automatically, every session | Always in effect: git rules, planning gate, commands, file map. Source of hard constraints. |
| `.agents/AGENTS.md` | On demand (NOT auto-loaded) | Doing real work: architecture (§1–5), Supabase/RLS rules (§3–4), **TipTap invariants (§6, mandatory for editor work)**, skills table (§7), UI/layout invariants (§8). Read the relevant section before touching those areas. Mostly Vietnamese. |
| `.gemini/GEMINI.md` | Only by Gemini CLI / Antigravity | Mirror of the project brain for parallel non-opencode sessions. Keep in sync with `.agents/AGENTS.md` when rules change; opencode sessions ignore it. |

# Subagents & skills

- No custom agents are defined (no `.opencode/agent/`). Subagents come from the harness Task tool: `explore` (fast codebase recon — prefer over blind `Glob`+`Grep` loops) and `general` (multi-step research, parallel audits, code review).
- Skills live in the **non-standard path `.agents/skills/`** (`superpowers/*`, `tiptap-prosemirror-best-practices`) — not `.opencode/skills`. Full trigger table is at `.agents/AGENTS.md` §7. Load via the skill tool **before** acting when a task matches:
  - any bug/failure → `systematic-debugging` (Iron Law: root-cause first, never fix blind)
  - P0/P1 plan review → `dispatching-parallel-agents` (≥2 auditors) — see Planning Gate below
  - after each phase / before merge → `requesting-code-review`
  - claiming done → `verification-before-completion` (run the gate, don't assert)
  - finishing work on a branch → `finishing-a-development-branch` (present merge/push/keep options; never push yourself)

# Commands (pnpm only — never npm; `packageManager: pnpm@11.23.0`, Node 22)

- Verify gate, in this order: `pnpm exec tsc --noEmit` → `pnpm lint` → `pnpm test` → `pnpm run build`
- Single test file: `pnpm vitest run tests/unit/<name>.test.ts` (vitest, jsdom, `@` = repo root; tests live only in `tests/unit/`)
- `pnpm run build` needs Supabase env: CI injects placeholders via secrets; locally `.env.local` (gitignored, never commit) provides real values.
- CI (`.github/workflows/ci.yml`): pushes/PRs to `main`/`master` run tsc + lint + vitest + build plus a gitleaks secret-scan (actions pinned to SHAs — update SHAs, never revert to mutable tags).

# CI Supply Chain & Action SHA Pinning Rules

Khi ghim SHA cho các GitHub Actions trong `.github/workflows/*.yml`:
1. **Truy vấn độc lập từng Repository**: Tuyệt đối không chạy gộp nhiều URL trong cùng một lệnh `git ls-remote`. Mỗi lệnh phải in kèm URL định danh.
2. **Quy tắc Bóc Tách Annotated Tag**:
   - Nếu output chỉ có 1 dòng (Lightweight tag) ➔ Lấy commit SHA của dòng đó.
   - Nếu output có 2 dòng (Annotated tag có `^{}`) ➔ **BẮT BUỘC lấy SHA của dòng có `^{}`** (Peeled Commit SHA), tuyệt đối không lấy dòng tag object.
3. **Thẩm Định Ngữ Nghĩa Qua API Trước Khi Commit**:
   - Chạy kiểm tra: `curl -s -o /dev/null -w "%{http_code}" https://api.github.com/repos/<owner>/<repo>/commits/<sha>`
   - Phải nhận HTTP 200 OK mới được đưa vào file YAML.

# Planning & Review Gate (Mandatory from 2026-08-31)

> Bài học từ Hardening Plan 2026-08-30: 6 Critical + 14 Moderate bị sót lần đầu do single-agent audit, thiếu cross-reference.

**Quy tắc:**
1. Mọi thay đổi kiến trúc P0/P1 phải có `implementation_plan.md` trong `docs/superpowers/plans/` và **chưa được code** cho tới khi review pass.
2. Review phải dùng `dispatching-parallel-agents` (ít nhất 2 auditors) + checklist 10 mục ở `.agents/AGENTS.md:0.4`.
3. Mỗi vòng review append `Appendix — Review Response Log` vào plan.
4. `pnpm exec tsc --noEmit` phải PASS trước khi gửi plan đi review.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
