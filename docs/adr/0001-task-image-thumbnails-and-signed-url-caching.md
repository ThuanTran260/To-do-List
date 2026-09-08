# Task Image Thumbnails, Batch Signed URLs, and Memory Defense

We store task attachments as dual files (full-resolution 1600px and 320px aspect-ratio preserved thumbnail) in Supabase Storage with dedicated database columns, isolate UI access behind domain helper functions, resolve signed URLs in 7-day cached batches with viewport gating and re-sign on expiry, and guard mobile client memory using object URLs, a 40MP ceiling, and runtime Canvas fallback.

## Status

accepted

## Context & Decision

Task attachments historically stored only a single high-resolution image (`image_path`), loaded individually via single-item `getSignedTaskImageUrl` queries with 60-minute expiration. On dashboard views with multiple image tasks, this caused excessive egress bandwidth, N+1 network roundtrips, potential Out-Of-Memory (OOM) tab crashes during 48MP phone photo decodes via Base64, and risk of orphaned files.

We decided to:
1. **Schema & Migration**: Add `image_thumb_path text` (nullable) to the `todos` table via a versioned migration (`supabase/migrations/20260909000000_todos_image_thumb_path.sql` `[MANUAL]`).
2. **UI Abstraction Barrier (Option B)**: All UI components (e.g., `TodoItem`, `TaskDetailView`) MUST access task images exclusively through domain helpers `getTaskThumbnail(task)` (resolves thumbnail with full fallback for lists/cards) and `getTaskImages(task)` (returns array of full image paths for detail views). Direct access to raw database fields (`todo.image_url`, `todo.image_path`, `todo.image_thumb_path`) in UI components is strictly prohibited (permitted only inside these helpers and storage upload/delete services). This ensures zero UI changes when migrating to 1->N attachments in the future.
3. **Parallel Upload & Churn Defense**: Compress both full (max 1600px, WebP q0.85) and thumb (max 320px aspect-ratio preserved, WebP q0.75) client-side. Upload concurrently via `Promise.allSettled`. Full upload is mandatory; thumbnail upload is optional. If thumb upload fails, persist the task with `image_thumb_path = null` and log a warning.
4. **Rollback Cleanup Isolation**: If database insertion fails during task creation, immediately execute a best-effort rollback deletion of the newly uploaded storage paths. This rollback cleanup applies strictly to newly uploaded paths in the current interaction and MUST NEVER be invoked with paths read from the database during task updates.
5. **Cascade Deletion**: Update `deleteTaskImage(...paths)` to accept variadic paths. All 5 deletion call sites (`TrashModal:42,184`, `TaskDetailView:49`, `EditTodoModal:75,80`) supply both `image_path` and `image_thumb_path`, deleting both in a single Storage `remove()` call.
6. **Client Memory (OOM) Guard**: Retain the existing 10MB file-size ceiling and add a resolution guard rejecting images where `naturalWidth * naturalHeight > 40,000,000` (40 Megapixels). Replace `FileReader.readAsDataURL` with `URL.createObjectURL()` and `URL.revokeObjectURL()`. Attempt `createImageBitmap` with resize options in a try/catch block, gracefully falling back to HTML5 Canvas `drawImage` when runtime options are unsupported.
7. **Batch Signed URLs & 7-Day TTL**: Implement `useBatchSignedUrls(paths)` using Supabase `createSignedUrls(paths, 604800)` (7 days) with query cache prefill. Handle both result branches: per-item error mapping and top-level batch network/auth errors (triggering query retry and temporary placeholder rendering). Drop viewport-gate ở tầng signed URL có chủ ý (batch 1-request cho toàn bộ `displayedTodos` đã loại bỏ hoàn toàn N+1 roundtrip và cực kỳ nhẹ); `next/image` ở tầng DOM vẫn đảm nhận viewport lazy-loading cho binary payload; revisit viewport-gate cho signed URL khi list >100 ảnh/user. Cập nhật `docs/security.md:67` phản ánh TTL 7 ngày và batch signing architecture.
8. **Legacy Data**: Existing tasks with only `image_path` continue falling back to full images via `getTaskThumbnail()`. If the count of legacy image tasks is under 100, execute a one-time developer admin script to generate and link thumbnails.

## Considered Options

- **Filename suffix convention (`_thumb.webp` without column)**: Rejected. It breaks on legacy non-WebP image paths, fails silently when thumbnail generation is skipped, and obstructs migration toward a dedicated `task_images` table.
- **Client-side lazy backfill**: Rejected. Having client reads trigger background storage uploads and database updates converts idempotent GET operations into concurrent writes, causes race conditions, and overburdens low-end mobile devices.
- **160px square crop thumbnails**: Rejected. High-DPI (2x-3x retina) screens require 160–240 device pixels for an 80 CSS pixel container, making 160px images visibly blurry. Center-cropping also destroys critical diagram or document edges.
- **Direct column access in UI (Option A)**: Rejected. Coupling components directly to `image_thumb_path` forces re-editing all UI call sites when transitioning from 1 to N attachments.

## Consequences

- Dashboard list views consume ~95% less bandwidth when rendering task thumbnails (~15–30KB per thumb vs 300–800KB per full image).
- Storage capacity footprint increases by roughly 3–5% per task with an image.
- All 5 `deleteTaskImage` call sites now safely purge both full and thumbnail files, preventing storage leakage.
- UI components are completely decoupled from database image columns, guaranteeing zero UI changes when migrating to 1->N attachments.
- Viewport gating prevents signing URLs for off-screen tasks, eliminating wasted egress and signature generation.
- `docs/security.md:67` reflects the updated 7-day signed URL cache contract.
