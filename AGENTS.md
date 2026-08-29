# Git workflow rules

- **NEVER run `git push`** (including `git push --force`, `git push -u`, or any variant). Pushing is always done manually by the user.
- You MAY run `git add`, `git commit`, `git status`, `git diff`, `git log`, and branch operations locally.
- When the user asks to "commit", do exactly that: stage the intended files and commit with a concise message. Then stop and remind the user to run `git push` themselves.