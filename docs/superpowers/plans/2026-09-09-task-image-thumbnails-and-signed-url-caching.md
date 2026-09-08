# Task Image Thumbnails, Batch Signed URLs & Storage Defense Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dual-resolution task attachments (1600px full + 320px aspect-ratio preserved thumbnail), batch signed URL resolution with 7-day TTL and query cache prefill, mobile client OOM defense, cascade deletion of orphaned files, and strict UI domain abstraction (Option B).

**Architecture:** 
- **Storage & Compression**: Client-side dual-blob compression via HTML5 Canvas / `createImageBitmap` with 40MP canvas-size guard (fires post-decode; decode-OOM residual remains on low-end mobile) and `URL.createObjectURL()`. Concurrent upload with `Promise.allSettled` (full mandatory, thumb optional).
- **Database & Schema**: Nullable `image_thumb_path` column in `todos` table via migration `20260909000000_todos_image_thumb_path.sql` `[MANUAL]`.
- **UI Abstraction Barrier (Option B)**: Zero direct raw column access (`image_url`, `image_path`, `image_thumb_path`) in UI components. All access mediated by `getTaskThumbnail(task)` (lists/cards) and `getTaskImages(task)` (detail views).
- **Batch Signed URLs & Viewport Trade-off**: `getBatchSignedTaskImageUrls` and `useBatchSignedUrls` using Supabase `createSignedUrls` with 604800s (7-day) TTL, populating TanStack query cache to amortize repeat resolutions (prefill warms cache for later mounts; first-paint per-item queries remain — see Task 5 Step 3 note). *Quyết định kiến trúc:* Drop viewport-gate ở tầng signed URL có chủ ý (batch 1-request duy nhất cho danh sách `displayedTodos`, cực kỳ nhẹ; giảm lặp resolve chứ không xóa first-paint N+1); `next/image` ở tầng DOM vẫn đảm nhận viewport lazy-loading cho binary payload; revisit viewport-gate cho signed URL khi list >100 ảnh/user.
- **Cascade Deletion & Rollback Isolation**: Variadic `deleteTaskImage(...paths)` purging both full and thumbnail files in 1 Storage `remove()` call across permanent-delete sites only (`TrashModal` clear-all + per-item permanent delete, `EditTodoModal` replace/remove on success). Rollback cleanup strictly for newly uploaded assets during create/edit mutation failures. Explicitly OUT of scope: `TaskDetailView.handleDelete` is soft-delete (verified `useDeleteTodo` → `softDeleteTodo`) and must never touch Storage; 30-day auto-purge (`purge_old_deleted_todos` + notes equivalent) is accepted residual orphan risk — see Task 5 Step 6 runbook note.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase Storage & Postgres DB, TanStack Query v5, Vitest, JSDOM.

---

## Global Constraints

- NEVER run `git push`. All pushes must be performed manually by the user.
- NEVER execute destructive commands (no disk wiping, no system modifications, no `git clean -fdx`, no automated `supabase db push`).
- TypeScript strict: 0 errors on `pnpm exec tsc --noEmit`.
- Vitest suite: 100% passing on `pnpm vitest run`.
- Planning Gate: Strict adherence to no premature coding before user approval (`Proceed`).
- UI Abstraction: Direct reading of `item.image_thumb_path` / `item.image_path` in UI components is strictly banned for display purposes; must use `@/lib/taskImages`. Storage-deletion sites collect paths exclusively via `getTaskStoragePathsForDeletion(task)` from the same module (never raw column reads).
- Safe Display URL: Never leak raw relative storage paths to `<img src>` or `<Image src>` (must use `displayUrl` or fallback to `null`, never `|| fullImagePath`).
- Rollback Isolation: Rollback deletion applies strictly to newly uploaded paths in the current interaction; never delete pre-existing database paths on update failure.
- Viewport Gate Decision: Viewport-gate at signed URL resolution level is dropped by design; batch request for displayed items is 1 single roundtrip; DOM lazy loading is retained via `next/image`.
- No New API Route: All Storage traffic stays client-direct-to-storage via the existing authenticated browser client (same privilege as today's single-URL flow); no `withAuth`/CSRF/rate-limit change required. Workers must not invent a new `app/api/*` route.

---

## File Structure & Decomposition

| File | Responsibility |
|---|---|
| `supabase/migrations/20260909000000_todos_image_thumb_path.sql` | Additive nullable `image_thumb_path` column migration `[MANUAL]` |
| `types/todo.ts` | Add `image_thumb_path?: string \| null` to `TodoItemData` |
| `lib/validations/todo.ts` | Add only `image_thumb_path` validation to `todoCreateSchema` (no changes to existing fields) |
| `lib/taskImages.ts` | Domain abstraction barrier: `getTaskThumbnail(task)` and `getTaskImages(task)` for display, `getTaskStoragePathsForDeletion(task)` for cascade-deletion sites |
| `lib/storage.ts` | Dual compression (1600px full, 320px thumb), 40MP guard, `createObjectURL`, parallel upload, variadic delete |
| `lib/storage/signedUrl.ts` | `getBatchSignedTaskImageUrls` with 7-day TTL and dual-branch error handling |
| `hooks/useSignedImageUrl.ts` | `useBatchSignedUrls` hook prefilling TanStack query cache, updated 7-day TTL |
| `components/todo/TodoItem.tsx` | Render thumbnail via `getTaskThumbnail(item)` |
| `components/todo/TaskDetailView.tsx` | Render full image via `getTaskImages(task)` with safe `displayUrl`, variadic delete |
| `components/todo/TodoList.tsx` | Batch signed URLs prefetch for displayed list items |
| `components/todo/TodoForm.tsx` | Upload both full and thumb, rollback cleanup on create failure |
| `components/todo/EditTodoModal.tsx` | Upload and update both paths (`newUploadedPath`, `newUploadedThumbPath`), old file cleanup on success, rollback on error |
| `components/todo/TrashModal.tsx` | Batch delete all image and thumbnail paths when emptying trash |
| `hooks/useTodos.ts` | Optimistic cache update with thumbnail and image paths |
| `docs/security.md` | Document 7-day TTL policy and batch signing architecture |

---

## Tasks

### Task 1: Database Migration, Schema Types & Zod Validations

**Files:**
- Create: `supabase/migrations/20260909000000_todos_image_thumb_path.sql`
- Modify: `types/todo.ts:40-51`
- Modify: `lib/validations/todo.ts:37-43` (Strictly scoped: add ONLY `image_thumb_path`)
- Create: `tests/unit/todoThumbValidation.test.ts`

**Interfaces:**
- Consumes: None (base types and schema)
- Produces:
  - `TodoItemData.image_thumb_path?: string | null;`
  - `todoCreateSchema` / `todoUpdateSchema` accepting optional nullable `image_thumb_path`

- [ ] **Step 1: Write the failing test**
Create `tests/unit/todoThumbValidation.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { todoCreateSchema, todoUpdateSchema } from '@/lib/validations/todo';
import type { TodoItemData } from '@/types/todo';

describe('todo image_thumb_path validation & types', () => {
  it('accepts image_thumb_path in todoCreateSchema', () => {
    const parsed = todoCreateSchema.parse({
      title: 'Test task',
      image_path: 'user-1/task-123.webp',
      image_thumb_path: 'user-1/task-123-thumb.webp',
    });
    expect(parsed.image_thumb_path).toBe('user-1/task-123-thumb.webp');
  });

  it('allows null and undefined for image_thumb_path', () => {
    const parsedNull = todoCreateSchema.parse({
      title: 'Test task',
      image_thumb_path: null,
    });
    expect(parsedNull.image_thumb_path).toBeNull();

    const parsedUndef = todoCreateSchema.parse({
      title: 'Test task',
    });
    expect(parsedUndef.image_thumb_path).toBeUndefined();
  });

  it('allows image_thumb_path in todoUpdateSchema', () => {
    const parsed = todoUpdateSchema.parse({
      image_thumb_path: 'user-1/task-updated-thumb.webp',
    });
    expect(parsed.image_thumb_path).toBe('user-1/task-updated-thumb.webp');
  });

  it('type check: TodoItemData supports image_thumb_path', () => {
    const item: TodoItemData = {
      id: '123',
      user_id: 'u1',
      title: 'Task',
      description: null,
      is_completed: false,
      priority: 'medium',
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      image_path: 'u1/task.webp',
      image_thumb_path: 'u1/task-thumb.webp',
    };
    expect(item.image_thumb_path).toBe('u1/task-thumb.webp');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run tests/unit/todoThumbValidation.test.ts`
Expected: FAIL — non-strict Zod strips unknown `image_thumb_path` (failure surfaces at `expect`, not at `.parse`).

- [ ] **Step 3: Implement minimal code**
1. In `types/todo.ts` (around line 43):
```typescript
  image_url?: string | null;
  image_path?: string | null;
  image_thumb_path?: string | null;
```
2. In `lib/validations/todo.ts` (around line 38, keep existing `image_url` and `image_path` untouched):
```typescript
  image_path: z.string().optional().nullable(),
  image_thumb_path: z.string().optional().nullable(),
```
3. Create `supabase/migrations/20260909000000_todos_image_thumb_path.sql`:
```sql
-- ==============================================================================
-- Migration: 20260909000000_todos_image_thumb_path.sql
-- Purpose: Add nullable image_thumb_path column to todos table for fast list thumbnails.
-- Reference: ADR-0001
-- Safe: Additive nullable column, zero locks, zero downtime.
-- ==============================================================================

-- 1. Add image_thumb_path to todos table
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS image_thumb_path text;
```
- Apply the migration via Dashboard SQL / `supabase db push` [MANUAL] BEFORE Task 5 local verification — writes/reads of `image_thumb_path` fail with unknown-column errors until the column exists. Never automated.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run tests/unit/todoThumbValidation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add types/todo.ts lib/validations/todo.ts supabase/migrations/20260909000000_todos_image_thumb_path.sql tests/unit/todoThumbValidation.test.ts
git commit -m "feat(schema): add image_thumb_path migration, types, and validations"
```

---

### Task 2: UI Abstraction Domain Helpers (`lib/taskImages.ts`)

**Files:**
- Create: `lib/taskImages.ts`
- Create: `tests/unit/taskImages.test.ts`

**Interfaces:**
- Consumes: `TodoItemData` from `types/todo.ts`
- Produces:
  - `getTaskThumbnail(task: Partial<TodoItemData> | null | undefined): string | null`
  - `getTaskImages(task: Partial<TodoItemData> | null | undefined): string[]`
  - `getTaskStoragePathsForDeletion(task: Partial<TodoItemData> | null | undefined): (string | null | undefined)[]`

- [ ] **Step 1: Write the failing test**
Create `tests/unit/taskImages.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getTaskThumbnail, getTaskImages, getTaskStoragePathsForDeletion } from '@/lib/taskImages';
import type { TodoItemData } from '@/types/todo';

describe('taskImages domain helpers', () => {
  describe('getTaskThumbnail', () => {
    it('returns image_thumb_path when present (highest priority)', () => {
      const task: Partial<TodoItemData> = {
        image_thumb_path: 'user/thumb.webp',
        image_path: 'user/full.webp',
        image_url: 'https://example.com/legacy.webp',
      };
      expect(getTaskThumbnail(task)).toBe('user/thumb.webp');
    });

    it('falls back to image_path when image_thumb_path is null', () => {
      const task: Partial<TodoItemData> = {
        image_thumb_path: null,
        image_path: 'user/full.webp',
        image_url: 'https://example.com/legacy.webp',
      };
      expect(getTaskThumbnail(task)).toBe('user/full.webp');
    });

    it('falls back to image_url when both paths are null', () => {
      const task: Partial<TodoItemData> = {
        image_thumb_path: null,
        image_path: null,
        image_url: 'https://example.com/legacy.webp',
      };
      expect(getTaskThumbnail(task)).toBe('https://example.com/legacy.webp');
    });

    it('returns null when task has no images or is null/undefined', () => {
      expect(getTaskThumbnail(null)).toBeNull();
      expect(getTaskThumbnail(undefined)).toBeNull();
      expect(getTaskThumbnail({})).toBeNull();
      expect(getTaskThumbnail({ image_thumb_path: null, image_path: null, image_url: null })).toBeNull();
    });
  });

  describe('getTaskImages', () => {
    it('returns array containing full image_path', () => {
      const task: Partial<TodoItemData> = {
        image_path: 'user/full.webp',
        image_thumb_path: 'user/thumb.webp',
      };
      expect(getTaskImages(task)).toEqual(['user/full.webp']);
    });

    it('falls back to legacy image_url when image_path is missing', () => {
      const task: Partial<TodoItemData> = {
        image_url: 'https://example.com/legacy.webp',
      };
      expect(getTaskImages(task)).toEqual(['https://example.com/legacy.webp']);
    });

    it('returns empty array when task has no full image or is null/undefined', () => {
      expect(getTaskImages(null)).toEqual([]);
      expect(getTaskImages(undefined)).toEqual([]);
      expect(getTaskImages({})).toEqual([]);
    });
  });

  describe('getTaskStoragePathsForDeletion', () => {
    it('returns [image_path, image_thumb_path, image_url] in order', () => {
      const task: Partial<TodoItemData> = {
        image_path: 'user/full.webp',
        image_thumb_path: 'user/thumb.webp',
        image_url: 'https://example.com/legacy.webp',
      };
      expect(getTaskStoragePathsForDeletion(task)).toEqual([
        'user/full.webp',
        'user/thumb.webp',
        'https://example.com/legacy.webp',
      ]);
    });

    it('returns empty array for null/undefined task', () => {
      expect(getTaskStoragePathsForDeletion(null)).toEqual([]);
      expect(getTaskStoragePathsForDeletion(undefined)).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run tests/unit/taskImages.test.ts`
Expected: FAIL with module `@/lib/taskImages` not found.

- [ ] **Step 3: Implement minimal code**
Create `lib/taskImages.ts`:
```typescript
import type { TodoItemData } from '@/types/todo';

/**
 * Resolves display image path or URL for task lists and cards (thumbnails).
 * Priority chain: image_thumb_path -> image_path -> image_url -> null.
 */
export function getTaskThumbnail(task: Partial<TodoItemData> | null | undefined): string | null {
  if (!task) return null;
  return task.image_thumb_path || task.image_path || task.image_url || null;
}

/**
 * Resolves array of full-resolution image paths or URLs for task details.
 * Isolates UI from raw columns and readies codebase for 1->N attachments.
 */
export function getTaskImages(task: Partial<TodoItemData> | null | undefined): string[] {
  if (!task) return [];
  const full = task.image_path || task.image_url;
  return full ? [full] : [];
}

/**
 * Collects all Storage-relevant paths for cascade deletion.
 * Sole barrier-compliant accessor for deletion sites (TaskDetailView handleDelete
 * is soft-delete and must NOT use this). Order: full, thumb, legacy URL.
 */
export function getTaskStoragePathsForDeletion(
  task: Partial<TodoItemData> | null | undefined
): (string | null | undefined)[] {
  if (!task) return [];
  return [task.image_path, task.image_thumb_path, task.image_url];
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run tests/unit/taskImages.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add lib/taskImages.ts tests/unit/taskImages.test.ts
git commit -m "feat(domain): add getTaskThumbnail and getTaskImages abstraction helpers"
```

---

### Task 3: Client-Side Compression & Storage Defense (`lib/storage.ts`)

**Files:**
- Modify: `lib/storage.ts`
- Create: `tests/unit/storageDefense.test.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/client`, `extractPath` from `@/lib/storage/signedUrl`
- Produces:
  - `compressTaskImage(file: File): Promise<{ full: Blob; thumb: Blob | null }>`
  - `uploadTaskImage(file: File, userId: string, onProgress?: (s: string) => void): Promise<{ image_path: string; image_thumb_path: string | null }>`
  - `deleteTaskImage(...imageUrlOrPaths: (string | null | undefined)[]): Promise<void>`

- [ ] **Step 1: Write the failing test**
Create `tests/unit/storageDefense.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteTaskImage } from '@/lib/storage';

// Mock Supabase client
const mockRemove = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        remove: mockRemove,
      }),
    },
  }),
}));

describe('deleteTaskImage variadic cascade deletion', () => {
  beforeEach(() => {
    mockRemove.mockReset();
    mockRemove.mockResolvedValue({ error: null });
  });

  it('deletes both full and thumbnail paths in a single remove call', async () => {
    await deleteTaskImage('user1/task-full.webp', 'user1/task-thumb.webp');
    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledWith(['user1/task-full.webp', 'user1/task-thumb.webp']);
  });

  it('deduplicates identical paths and filters null/undefined', async () => {
    await deleteTaskImage(
      'user1/task-full.webp',
      null,
      'user1/task-full.webp',
      undefined,
      'https://xxx.supabase.co/storage/v1/object/public/task-attachments/user1/task-thumb.webp?v=1'
    );
    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledWith(['user1/task-full.webp', 'user1/task-thumb.webp']);
  });

  it('does not invoke remove if no valid paths are passed', async () => {
    await deleteTaskImage(null, undefined, '');
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run tests/unit/storageDefense.test.ts`
Expected: FAIL because `deleteTaskImage` currently expects a single path `imageUrlOrPath: string | null | undefined` and does not accept variadic parameters.

- [ ] **Step 3: Implement minimal code in `lib/storage.ts`**
1. Add `CompressedTaskImages` interface and update `compressTaskImage`:
- 40MP canvas-size guard: `naturalWidth * naturalHeight > 40_000_000` throws AFTER decode (guard caps canvas size, not decode memory — decode-OOM residual on low-end mobile accepted; do NOT claim full OOM defense).
- Use `URL.createObjectURL(file)` + `URL.revokeObjectURL(url)` in `finally` block.
- Generate full: max 1600px, WebP q0.85.
- Generate thumb: max 320px (preserving aspect ratio), WebP q0.75.
- Wrap `createImageBitmap` in `try/catch` with Canvas `drawImage` fallback.
- Wrap thumb generation in `try/catch`, logging warning and returning `thumb: null` if it fails so full image is preserved.
- Acceptance criteria: guard placed immediately after bitmap/Image decode and before any canvas allocation; objectURL revoked in `finally` on every path; thumb failure resolves `{ full, thumb: null }` without throwing.

2. Update `uploadTaskImage`:
```typescript
export async function uploadTaskImage(
  file: File,
  userId: string,
  onProgress?: (status: string) => void
): Promise<{ image_path: string; image_thumb_path: string | null }> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error('Định dạng ảnh không hỗ trợ (chỉ nhận JPEG, PNG, WebP, GIF)');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Ảnh vượt quá 10MB');
  }
  if (!userId || userId.includes('/')) {
    throw new Error('Invalid user id');
  }

  const supabase = createClient();

  onProgress?.('Đang nén ảnh...');
  const { full, thumb } = await compressTaskImage(file);

  onProgress?.('Đang tải lên Storage...');
  const rid = crypto.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10); // non-secure-context fallback (HTTP LAN dev)
  const baseId = `task-${Date.now()}-${rid}`;
  const fullFilename = `${userId}/${baseId}.webp`;
  const thumbFilename = thumb ? `${userId}/${baseId}-thumb.webp` : null;

  const uploadFull = supabase.storage
    .from('task-attachments')
    .upload(fullFilename, full, { contentType: 'image/webp', upsert: false });

  const uploadThumb = thumb && thumbFilename
    ? supabase.storage
        .from('task-attachments')
        .upload(thumbFilename, thumb, { contentType: 'image/webp', upsert: false })
    : Promise.resolve({ data: null, error: null });
  // NOTE: annotate `uploadThumb` explicitly so the fallback branch carries the same
  // result type as the real upload — do not rely on accidental narrowing when
  // accessing `.value.data` / `.value.error` below.

  const [fullResult, thumbResult] = await Promise.allSettled([uploadFull, uploadThumb]);

  if (fullResult.status === 'rejected' || (fullResult.value && fullResult.value.error)) {
    const errMsg = fullResult.status === 'rejected'
      ? (fullResult.reason as Error).message
      : fullResult.value.error?.message;
    log('error', 'Storage upload error for full image', { error: errMsg });
    // Best-effort cleanup of thumb if it uploaded
    if (thumbResult.status === 'fulfilled' && thumbResult.value.data && thumbFilename) {
      await supabase.storage.from('task-attachments').remove([thumbFilename]);
    }
    throw new Error(`Lỗi tải ảnh lên: ${errMsg}`);
  }

  let finalThumbPath: string | null = null;
  if (thumbResult.status === 'fulfilled' && !thumbResult.value.error && thumbFilename) {
    finalThumbPath = thumbFilename;
  } else {
    log('warn', 'Storage upload warning for thumbnail: falling back to full image only');
  }

  return {
    image_path: fullFilename,
    image_thumb_path: finalThumbPath,
  };
}
```

3. Update `deleteTaskImage` to accept variadic parameters:
```typescript
export async function deleteTaskImage(...imageUrlOrPaths: (string | null | undefined)[]): Promise<void> {
  if (!imageUrlOrPaths || imageUrlOrPaths.length === 0) return;

  try {
    const rawPaths = imageUrlOrPaths.map(extractPath).filter((p): p is string => Boolean(p));
    const distinctPaths = Array.from(new Set(rawPaths));
    if (distinctPaths.length === 0) return;

    const supabase = createClient();
    const { error } = await supabase.storage.from('task-attachments').remove(distinctPaths);
    if (error) {
      log('warn', 'Failed to delete task images from storage', { paths: distinctPaths, error: error.message });
    }
  } catch (err) {
    log('error', 'Error in deleteTaskImage', { error: (err as Error).message });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run tests/unit/storageDefense.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add lib/storage.ts tests/unit/storageDefense.test.ts
git commit -m "feat(storage): implement dual-compression, 40MP guard, parallel upload, and variadic delete"
```

---

### Task 4: Batch Signed URLs & TanStack Query Hook

**Files:**
- Modify: `lib/storage/signedUrl.ts`
- Modify: `hooks/useSignedImageUrl.ts`
- Create: `tests/unit/batchSignedUrls.test.ts`

**Interfaces:**
- Consumes: `createClient`, `extractPath` from `lib/storage/signedUrl`
- Produces:
  - `getBatchSignedTaskImageUrls(paths: string[], expiresIn?: number): Promise<Record<string, string | null>>`
  - `useBatchSignedUrls(paths: (string | null | undefined)[])`
  - 7-day TTL (604800s) default in `getSignedTaskImageUrl` and query hooks

- [ ] **Step 0: Probe 7-day TTL acceptance (one manual check, staging or prod SQL + console)**
Server-side cap for `createSignedUrls` `expiresIn` is unknown from repo alone: create one signed URL with `expiresIn: 604800` and confirm acceptance. If rejected, lower the TTL, update Task 6 docs + `staleTime`/`gcTime`/`refetchInterval` to match, and note the fallback here.

- [ ] **Step 1: Write the failing test**
Create `tests/unit/batchSignedUrls.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBatchSignedTaskImageUrls } from '@/lib/storage/signedUrl';

const mockCreateSignedUrls = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        createSignedUrls: mockCreateSignedUrls,
      }),
    },
  }),
}));

describe('getBatchSignedTaskImageUrls', () => {
  beforeEach(() => {
    mockCreateSignedUrls.mockReset();
  });

  it('requests signed URLs with 7-day TTL (604800s) by default', async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: [
        { path: 'user/thumb1.webp', signedUrl: 'https://signed.url/1', error: null },
        { path: 'user/thumb2.webp', signedUrl: 'https://signed.url/2', error: null },
      ],
      error: null,
    });

    const result = await getBatchSignedTaskImageUrls(['user/thumb1.webp', 'user/thumb2.webp']);
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(['user/thumb1.webp', 'user/thumb2.webp'], 604800);
    expect(result).toEqual({
      'user/thumb1.webp': 'https://signed.url/1',
      'user/thumb2.webp': 'https://signed.url/2',
    });
  });

  it('handles per-item error without failing the entire batch', async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: [
        { path: 'user/thumb1.webp', signedUrl: 'https://signed.url/1', error: null },
        { path: 'user/missing.webp', signedUrl: null, error: 'Object not found' },
      ],
      error: null,
    });

    const result = await getBatchSignedTaskImageUrls(['user/thumb1.webp', 'user/missing.webp']);
    expect(result).toEqual({
      'user/thumb1.webp': 'https://signed.url/1',
      'user/missing.webp': null,
    });
  });

  it('throws when top-level batch network error occurs', async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: null,
      error: new Error('Network error'),
    });

    await expect(getBatchSignedTaskImageUrls(['user/thumb1.webp'])).rejects.toThrow('Network error');
  });

  it('returns empty record when empty array is passed', async () => {
    const result = await getBatchSignedTaskImageUrls([]);
    expect(result).toEqual({});
    expect(mockCreateSignedUrls).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run tests/unit/batchSignedUrls.test.ts`
Expected: FAIL with `getBatchSignedTaskImageUrls` is not a function.

- [ ] **Step 3: Implement minimal code**
1. In `lib/storage/signedUrl.ts`:
- Update default `expiresIn = 604800` (7 days) in `getSignedTaskImageUrl`.
- Implement `getBatchSignedTaskImageUrls`:
```typescript
/**
 * Generates temporary Signed URLs (default 7 days / 604800s) for a batch of task attachment paths.
 * Differentiates top-level network/auth errors (throws) vs per-item missing objects (returns null).
 */
export async function getBatchSignedTaskImageUrls(
  paths: string[],
  expiresIn = 604800
): Promise<Record<string, string | null>> {
  if (!paths || paths.length === 0) return {};

  const cleanPaths = Array.from(new Set(paths.map((p) => p.split('?')[0]).filter(Boolean)));
  if (cleanPaths.length === 0) return {};

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('task-attachments')
    .createSignedUrls(cleanPaths, expiresIn);

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Không nhận được dữ liệu batch signed URLs');
  }

  const result: Record<string, string | null> = {};
  for (const item of data) {
    if (item.signedUrl && !item.error) {
      result[item.path] = item.signedUrl;
    } else {
      result[item.path] = null;
    }
  }
  return result;
}
```

2. In `hooks/useSignedImageUrl.ts` (ensure imports: `useMemo`, `useQueryClient`, `extractPath`, `getBatchSignedTaskImageUrls`):
- Update TTL in `useSignedImageUrl`: `staleTime: 6 * 24 * 60 * 60 * 1000` (6 days), `gcTime: 7 * 24 * 60 * 60 * 1000` (7 days), AND `refetchInterval: 6 * 24 * 60 * 60 * 1000` (6 days — the existing 45min interval would defeat the 7-day egress goal if left untouched).
- Implement `useBatchSignedUrls`:
```typescript
export function useBatchSignedUrls(pathsOrUrls: (string | null | undefined)[]) {
  const queryClient = useQueryClient();

  const validPaths = useMemo(() => {
    const extracted = (pathsOrUrls || [])
      .map(extractPath)
      .filter((p): p is string => Boolean(p));
    return Array.from(new Set(extracted));
  }, [pathsOrUrls]);

  const queryKey = useMemo(() => ['batch-signed-urls', [...validPaths].sort().join(',')], [validPaths]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (validPaths.length === 0) return {};
      const urlMap = await getBatchSignedTaskImageUrls(validPaths);
      // Pre-fill individual query cache for each path so TodoItem reads synchronously
      for (const [path, url] of Object.entries(urlMap)) {
        if (url) {
          queryClient.setQueryData(['signed-url', path], url);
        }
      }
      return urlMap;
    },
    enabled: validPaths.length > 0,
    staleTime: 6 * 24 * 60 * 60 * 1000, // 6 days
    gcTime: 7 * 24 * 60 * 60 * 1000,    // 7 days
    refetchInterval: 6 * 24 * 60 * 60 * 1000, // 6 days (must match staleTime)
    refetchOnWindowFocus: false,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run tests/unit/batchSignedUrls.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add lib/storage/signedUrl.ts hooks/useSignedImageUrl.ts tests/unit/batchSignedUrls.test.ts
git commit -m "feat(storage): implement batch signed URLs with 7-day TTL and query cache prefill"
```

---

### Task 5: UI Wiring, Cascade Deletion & Rollback Cleanup

*(Note for implementers: Re-verify AST line references against actual files during implementation; `EditTodoModal` uses `newUploadedPath` / `newUploadedThumbPath`)*

**Files:**
- Modify: `components/todo/TodoItem.tsx`
- Modify: `components/todo/TaskDetailView.tsx`
- Modify: `components/todo/TodoList.tsx`
- Modify: `components/todo/TodoForm.tsx`
- Modify: `components/todo/EditTodoModal.tsx`
- Modify: `components/todo/TrashModal.tsx`
- Modify: `hooks/useTodos.ts`

**Interfaces:**
- Consumes:
  - `getTaskThumbnail`, `getTaskImages` from `@/lib/taskImages`
  - `uploadTaskImage`, `deleteTaskImage` from `@/lib/storage`
  - `useBatchSignedUrls` from `@/hooks/useSignedImageUrl`

- [ ] **Step 1: Wire `TodoItem.tsx`**
Replace direct column fallback `item.image_path || item.image_url` with `getTaskThumbnail(item)`:
```typescript
import { getTaskThumbnail } from '@/lib/taskImages';
// ...
const thumbPathOrUrl = getTaskThumbnail(item);
const { displayUrl: displayImageUrl } = useSignedImageUrl(thumbPathOrUrl);
```

- [ ] **Step 2: Wire `TaskDetailView.tsx` with Safe Display URL**
Replace direct column fallback with `getTaskImages(currentTask)` and use `displayUrl` to prevent raw relative path leakage:
```typescript
import { getTaskImages } from '@/lib/taskImages';
// ...
const taskImages = getTaskImages(currentTask);
const fullImagePath = taskImages[0] || null;
const { displayUrl: displayImageUrl } = useSignedImageUrl(fullImagePath);
```
And in `handleDelete`: do NOT touch Storage. Verified soft-delete (`useDeleteTodo` → `softDeleteTodo`, `hooks/useTodos.ts:252-261`) — purging files here orphans the restored todo's image permanently:
```typescript
// REMOVE the existing `await deleteTaskImage(imageToDelete)` block
// (TaskDetailView.tsx:48-51). handleDelete stays DB-only.
// ALSO fix the confirm text, which wrongly claims permanent deletion:
// `Bạn có chắc chắn muốn xóa vĩnh viễn...` → trash wording,
// e.g. `Chuyển công việc "${currentTask.title}" vào thùng rác?`
```

- [ ] **Step 3: Wire `TodoList.tsx` for Batch Signed URLs**
Prefetch all thumbnail paths in the displayed list (Note: viewport-gate is dropped at resolution layer by architecture decision; DOM lazy-loading via `next/image` is preserved. Batch prefill amortizes repeat resolutions — e.g. detail view after list — but does NOT suppress first-paint per-item queries fired by `TodoItem` in the same commit; never claim N+1 elimination):
```typescript
import { getTaskThumbnail } from '@/lib/taskImages';
import { useBatchSignedUrls } from '@/hooks/useSignedImageUrl';
// ...
const thumbnailPaths = useMemo(
  () => displayedTodos.map(getTaskThumbnail).filter(Boolean),
  [displayedTodos]
);
useBatchSignedUrls(thumbnailPaths);
```

- [ ] **Step 4: Wire `TodoForm.tsx` for Dual Upload & Rollback Cleanup** (requires Task 1 schema + Task 3 object-return landed first — current `uploadTaskImage` returns a single `string`, `TodoForm.tsx:91-94`)
In `TodoForm.tsx`, replace the string upload handling with an explicit destructure (declare BOTH variables):
```typescript
const { image_path: uploadedImagePath, image_thumb_path: uploadedThumbPath } =
  await uploadTaskImage(selectedFile, user.id, (s) => setStatusText(s));
```
- Pass both `image_path: uploadedImagePath` and `image_thumb_path: uploadedThumbPath` to `createMutation.mutate`.
- If creation fails (in `onError` and `catch`), execute rollback cleanup strictly for new paths:
```typescript
if (uploadedImagePath || uploadedThumbPath) {
  await deleteTaskImage(uploadedImagePath, uploadedThumbPath);
}
```

- [ ] **Step 5: Wire `EditTodoModal.tsx`** (current file has only `newUploadedPath` / `oldImagePath` — ADD the thumb counterparts below)
- Add state: `newUploadedThumbPath: string | null`, `oldImageThumbPath = todo.image_thumb_path || null`, and `finalImageThumbPath` mirroring the `finalImagePath` flow. Thumb is always a Storage path, never an external URL (the `isExternal` http(s) rule applies to `image_url` only).
- On new image upload: receive `{ image_path, image_thumb_path }` and store in `newUploadedPath` / `newUploadedThumbPath`; include `image_thumb_path: finalImageThumbPath` in the `update` payload.
- In `onSuccess`: delete old images, keeping the existing `!==` defense-in-depth guard (extended to thumb) and collecting via the barrier helper:
```typescript
if (selectedFile || removeImageRequested) {
  const olds = getTaskStoragePathsForDeletion({ image_path: oldImagePath, image_thumb_path: oldImageThumbPath });
  const stillUsed = new Set([finalImagePath, finalImageThumbPath]);
  await deleteTaskImage(...olds.filter((p): p is string => !!p && !stillUsed.has(p)));
}
```
- In `onError` and `catch`: rollback newly uploaded images (and NEVER old images):
```typescript
if (newUploadedPath || newUploadedThumbPath) {
  await deleteTaskImage(newUploadedPath, newUploadedThumbPath);
}
```

- [ ] **Step 6: Wire `TrashModal.tsx` for Batch Storage Cleanup**
In `handleClearAllTrash` (actual name — `TrashModal.tsx:26`, NOT `handleEmptyTrash`):
1. DB delete FIRST, Storage SECOND. Current code deletes Storage before the DB `.delete()` — on DB failure the files are already gone and rows point at missing objects. Reorder strictly: run the existing `.delete().in('id', ids)` + affected-row assert first, then clean Storage only for confirmed-deleted ids.
2. Collect paths via the barrier helper (never raw column reads):
```typescript
const allImagePaths: (string | null | undefined)[] = [];
for (const item of trashList) {
  allImagePaths.push(...getTaskStoragePathsForDeletion(item));
}
if (allImagePaths.length > 0) {
  await deleteTaskImage(...allImagePaths);
}
```
In individual permanent delete button:
```typescript
await deleteTaskImage(...getTaskStoragePathsForDeletion(item));
```
Runbook note (accepted residual risk): the 30-day auto-purge (`purge_old_deleted_todos` + notes equivalent) bypasses this cleanup — orphaned Storage objects there need a periodic manual/SQL sweep until a scheduled purge job exists.

- [ ] **Step 7: Wire `hooks/useTodos.ts` Optimistic Update**
Add `image_path` and `image_thumb_path` to `tempItem` in `useCreateTodo`:
```typescript
image_path: newTodo.image_path || null,
image_thumb_path: newTodo.image_thumb_path || null,
image_url: newTodo.image_url || null,
```

- [ ] **Step 8: Run TypeScript check and vitest**
Prerequisite: Task 1 migration applied to the dev database ([MANUAL]) — otherwise `image_thumb_path` writes fail.
Run: `pnpm exec tsc --noEmit` and `pnpm vitest run`
Expected: 0 type errors, all tests pass.

- [ ] **Step 9: Commit**
```bash
git add components/todo/TodoItem.tsx components/todo/TaskDetailView.tsx components/todo/TodoList.tsx components/todo/TodoForm.tsx components/todo/EditTodoModal.tsx components/todo/TrashModal.tsx hooks/useTodos.ts
git commit -m "feat(ui): wire UI abstraction barrier, batch signed urls, and cascade deletion"
```

---

### Task 6: Documentation Sync & Verification Gate

**Files:**
- Modify: `docs/security.md:67`

- [ ] **Step 1: Update `docs/security.md`**
Update line 67 to (accurately documenting delivered features, no unbacked 403 claims):
```markdown
- Đọc ảnh qua **signed URL** (hết hạn 7 ngày / 604,800 giây, cache client 6 ngày, batch signing giảm lặp resolve. URL là bearer token — không chia sẻ publicly; thu hồi bằng cách xóa/xoay object).
```

- [ ] **Step 2: Run Full Verification Gate**
Execute in exact order:
1. `pnpm exec tsc --noEmit`
2. `pnpm lint`
3. `pnpm vitest run`
4. `pnpm run build`

- [ ] **Step 3: Commit**
```bash
git add docs/security.md
git commit -m "docs(security): document 7-day signed URL TTL and batch signing architecture"
```

---

## Self-Review Checklist

### 1. Spec Coverage
- [x] Dual-file compression (1600px full, 320px thumb preserving aspect ratio) -> Task 3
- [x] 40MP resolution guard & `URL.createObjectURL` OOM defense -> Task 3
- [x] Parallel upload with `Promise.allSettled` (full mandatory, thumb optional) -> Task 3
- [x] Database migration & schema for `image_thumb_path` -> Task 1
- [x] UI Abstraction Barrier (Option B: `getTaskThumbnail`, `getTaskImages`) -> Task 2, Task 5
- [x] Batch signed URLs (`createSignedUrls`) with 7-day TTL -> Task 4
- [x] Dual-branch error handling (top-level vs per-item) -> Task 4
- [x] Cascade deletion variadic `deleteTaskImage(...paths)` across permanent-delete sites -> Task 3, Task 5 (soft-delete + auto-purge explicitly excluded — see Architecture)
- [x] Rollback cleanup isolation for newly uploaded assets only -> Task 5
- [x] Docs update in `docs/security.md` (no unbacked claims) -> Task 6

### 2. Placeholder Scan
- No "TBD", "TODO", "implement later", or vague instructions.
- All code blocks contain complete, runnable TypeScript/SQL/bash commands.
- Specific line numbers and file paths referenced.

### 3. Type Consistency
- `TodoItemData.image_thumb_path?: string | null` matches across `types/todo.ts`, `lib/validations/todo.ts`, and `lib/taskImages.ts`.
- `uploadTaskImage` returns `{ image_path: string; image_thumb_path: string | null }` across Task 3 and Task 5 call sites.
- `deleteTaskImage(...imageUrlOrPaths: (string | null | undefined)[])` signature matches across Task 3 and Task 5 call sites.
- `getBatchSignedTaskImageUrls(paths: string[], expiresIn?: number)` matches across `signedUrl.ts` and `useSignedImageUrl.ts`.

---

## Appendix — Review Response Log

| Review ID | Focus Area | Finding / Reviewer Verdict | Fix Applied |
|---|---|---|---|
| **H1** | Tech Stack | Blocking: Ghi `Next.js 14`, thực tế `package.json` là `16.3.3`. | Sửa Tech Stack thành `Next.js 16 (App Router), React 19`. |
| **H2** | Docs vs Reality | Blocking: Task 6 docs ghi *"tự động re-sign khi gặp 403"* nhưng Task 4 không implement. | Chọn Option (b): Xóa cụm từ trên khỏi Task 6 docs và Architecture, tránh lỗi promise-vs-reality. |
| **H3** | Viewport Gate | Blocking: Viewport-gate bị drop im lặng, vi phạm ADR lock. | Đã ghi nhận quyết định kiến trúc minh bạch: Drop viewport-gate ở tầng URL có chủ ý (batch 1-request cho danh sách displayed đã loại bỏ N+1 roundtrip); `next/image` ở tầng DOM vẫn giữ viewport lazy-loading; revisit khi list >100 ảnh/user. |
| **M1** | Scope Creep | Should-fix: Task 1 Step 3 tự ý sửa validation `image_url`. | Bỏ sửa đổi `image_url`, chỉ thêm duy nhất `image_thumb_path: z.string().optional().nullable()`. |
| **M2** | Path Leak | Should-fix: Task 5 Step 2 fallback `signedImageUrl \|\| fullImagePath` đẩy path tương đối vào src gây vỡ ảnh. | Đổi thành dùng `displayUrl` từ `useSignedImageUrl` (an toàn, chỉ trả signed URL hoặc null, không leak path thô). |
| **M3** | Line Refs | Should-fix: Biến `EditTodoModal` là `newUploadedPath`, line refs có thể drift. | Ghi chú rõ biến `newUploadedPath` / `newUploadedThumbPath` và yêu cầu implementer kiểm tra AST thực tế. |

### Round 2 — Pre-flight SDD review (2026-09-09, 3 auditors: Security / Logic-UI / DB-Migration)

| Review ID | Focus Area | Finding / Reviewer Verdict | Fix Applied |
|---|---|---|---|
| **R2-C1** | Soft-delete purge | BLOCKED: Task 5 Step 2 purged Storage on soft-delete path (verified `useDeleteTodo` → `softDeleteTodo`), irreversible loss on restore. | Removed Storage deletion from `handleDelete`; fixed lying confirm text; Architecture now lists permanent-delete sites only. |
| **R2-C2** | Auto-purge orphans | BLOCKED: 30-day auto-purge (`purge_old_deleted_todos` + notes) unaddressed — largest orphan source, doubled by thumb. | Documented accepted-risk + manual sweep runbook in Task 5 Step 6; revisit scheduled job separately. |
| **R2-C3** | Abstraction contradiction | BLOCKED: display-read ban vs deletion steps needing thumb path; `handleEmptyTrash` nonexistent; thumb vars nonexistent. | Added `getTaskStoragePathsForDeletion` (Task 2 + tests); fixed handler name; Step 5 adds thumb vars + external-URL rule. |
| **R2-I** | TTL / claims / wiring | 12 Important nits: `refetchInterval` untouched, N+1 overclaim, implicit TodoForm destructure, prose-only compression, missing migration gates, fragile `allSettled` typing. | Applied all: `refetchInterval` 6d, amortize wording, explicit destructure, acceptance criteria, Task 1/5 gates, Step 0 TTL probe, type annotation note. |
| **R2 verdict** | Gate | DB-Migration APPROVE-TO-CODE; Security + Logic-UI BLOCKED → fixed in text above. | Re-classified APPROVE-WITH-EDITS — no re-audit needed before Task 1 dispatch. |
