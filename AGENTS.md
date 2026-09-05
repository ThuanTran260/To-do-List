# Git workflow rules

- **NEVER run `git push`** (including `git push --force`, `git push -u`, or any variant). Pushing is always done manually by the user.
- You MAY run `git add`, `git commit`, `git status`, `git diff`, `git log`, and branch operations locally.
- When the user asks to "commit", do exactly that: stage the intended files and commit with a concise message. Then stop and remind the user to run `git push` themselves.

# Planning & Review Gate (Mandatory from 2026-08-31)

> Bài học từ Hardening Plan 2026-08-30: 6 Critical + 14 Moderate bị sót lần đầu do single-agent audit, thiếu cross-reference.

**Quy tắc:**
1. Mọi thay đổi kiến trúc P0/P1 phải có `implementation_plan.md` trong `docs/superpowers/plans/` và **chưa được code** cho tới khi review pass.
2. Review phải dùng `dispatching-parallel-agents` (ít nhất 2 auditors) + checklist 10 mục ở `.agents/AGENTS.md:0.4`.
3. Mỗi vòng review append `Appendix — Review Response Log` vào plan.
4. `npx tsc --noEmit` phải PASS trước khi gửi plan đi review.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
