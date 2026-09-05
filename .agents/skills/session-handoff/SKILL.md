---
name: session-handoff
description: Use when context window is nearly exhausted and unfinished work must resume in a fresh session without losing progress, re-asking settled questions, or re-introducing fixed bugs.
---

# Session Handoff

## Overview

A handoff file lets the next session resume exactly where this one stopped. Its only job: verified facts + the single next action.

## When to Use

- Context usage is high (>80%) with unfinished work (uncommitted changes, failing gate, mid-plan task).
- When NOT to use: everything committed, gate green, nothing in flight.

## The Contract

Exactly these sections, in order. Nothing else.

1. **State (verified, not remembered):** branch, last 3–5 commits (`git log --oneline`), working tree (`git status --short`), sync vs base (`git log origin/main..HEAD --oneline`, `git branch -r --contains HEAD`). Paste outputs.
2. **In-flight work:** each item with `file:line`, DONE vs REMAINS, exact next command.
3. **Open issues:** marked OBSERVED (saw it fail) or HYPOTHESIZED (suspect it).
4. **Hard rules:** max 3 lines, copied verbatim from the repo instruction file.
5. **Resume pointer:** plan/tracking file path if one exists.

## Rules

- **Evidence before prose.** Claims come from just-run commands; otherwise mark `[UNVERIFIED]`.
- **No invented design.** Unknowns stay `UNKNOWN:` — never filled in to "be helpful".
- **No session-meta leakage.** Project state only; never mention this skill, the process, or any experiment.
- **Confidence labels** (`[VERIFIED]`/`[ASSUMED]`/`[UNVERIFIED]`) on factual claims, not on instructions or headers.
- **One next action.** A single concrete step, not a menu.

## Rationalizations (observed in baseline — reject all three)

| Excuse | Reality |
|---|---|
| "More detail is safer" | Unverified detail becomes false instructions. |
| "Summary needs no commands" | Memory lies about git state. Paste output or label `[UNVERIFIED]`. |
| "One process note helps" | Meta-notes leak across sessions. Project state only. |

## Common Mistakes

| Mistake | Fix |
|---|---|
| Git state from memory | Run the commands, paste outputs |
| Vague resume ("open and see") | `file:line` + done-vs-remaining + next command |
| Reworded repo rules | Copy the 3 lines verbatim |

## Red Flags — STOP and rewrite

- Implementation detail with no prior decision behind it
- Any sentence about this skill, session, or experiment
- Git claim without pasted command output
- Missing label where one is needed
- More than one next step
