# Task Image Thumbnails, Batch Signed URLs, and Memory Defense

We store task attachments as dual files (full-resolution 1600px and 320px aspect-ratio preserved thumbnail) in Supabase Storage with dedicated database columns, resolve signed URLs in 7-day cached batches with per-item and top-level error tolerance, and guard mobile client memory using object URLs, a 40MP ceiling, and runtime Canvas fallback.

## Status

accepted

## Context & Decision

Task attachments historically stored only a single high-resolution image (`image_path`), loaded individually via single-item `getSignedTaskImageUrl` queries with 60-minute expiration. On dashboard views with multiple image tasks, this caused excessive egress bandwidth, N+1 network roundtrips, potential Out-Of-Memory (OOM) tab crashes during 48MP phone photo decodes via Base64, and risk of orphaned files.

We decided to:
1. **Schema**: Add `image_thumb_path text` (nullable) to the `todos` table. TodoItem renders `image_thumb_path || image_path || image_url`, while TaskDetailView always renders the full `image_path || image_url`.
2. **Parallel Upload & Churn Defense**: Compress both full (max 1600px, WebP q0.85) and thumb (max 320px aspect-ratio preserved, WebP q0.75) client-side. Upload concurrently via `Promise.allSettled`. Full upload is mandatory; thumbnail upload is optional. If thumb upload fails, persist the task with `image_thumb_path = null` and log a warning.
3. **Rollback Cleanup Isolation**: If database insertion fails during task creation, immediately execute a best-effort rollback deletion of the newly uploaded storage paths. This rollback cleanup applies strictly to newly uploaded paths in the current interaction and MUST NEVER be invoked with paths read from the database during task updates.
4. **Cascade Deletion**: Update `deleteTaskImage(...paths)` to accept variadic paths. All deletion call sites (TrashModal, TaskDetailView, EditTodoModal) supply both `image_path` and `image_thumb_path`, deleting both in a single Storage `remove()` call.
5. **Client Memory (OOM) Guard**: Retain the existing 10MB file-size ceiling and add a resolution guard rejecting images where `naturalWidth * naturalHeight > 40,000,000` (40 Megapixels). Replace `FileReader.readAsDataURL` with `URL.createObjectURL()` and `URL.revokeObjectURL()`. Attempt `createImageBitmap` with resize options in a try/catch block, gracefully falling back to HTML5 Canvas `drawImage` when runtime options are unsupported.
6. **Batch Signed URLs & 7-Day TTL**: Implement `useBatchSignedUrls(paths)` using Supabase `createSignedUrls(paths, 604800)` (7 days). Handle both result branches: per-item error mapping (allowing healthy images to render when a single file is missing) and top-level batch network/auth errors (triggering query retry and temporary placeholder rendering). Update `docs/security.md` to document the 7-day TTL policy.
7. **Legacy Data**: Existing tasks with only `image_path` continue falling back to full images. If the count of legacy image tasks is under 100, execute a one-time developer admin script to generate and link thumbnails.

## Considered Options

- **Filename suffix convention (`_thumb.webp` without column)**: Rejected. It breaks on legacy non-WebP image paths, fails silently when thumbnail generation is skipped, and obstructs migration toward a dedicated `task_images` table.
- **Client-side lazy backfill**: Rejected. Having client reads trigger background storage uploads and database updates converts idempotent GET operations into concurrent writes, causes race conditions, and overburdens low-end mobile devices.
- **160px square crop thumbnails**: Rejected. High-DPI (2x-3x retina) screens require 160–240 device pixels for an 80 CSS pixel container, making 160px images visibly blurry. Center-cropping also destroys critical diagram or document edges.

## Consequences

- Dashboard list views consume ~95% less bandwidth when rendering task thumbnails (~15–30KB per thumb vs 300–800KB per full image).
- Storage capacity footprint increases by roughly 3–5% per task with an image.
- All 5 `deleteTaskImage` call sites now safely purge both full and thumbnail files, preventing storage leakage.
- `docs/security.md` reflects the updated 7-day signed URL cache contract.
