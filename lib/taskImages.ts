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
