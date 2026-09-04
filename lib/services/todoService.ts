import type { SupabaseClient } from '@supabase/supabase-js';
import { todoCreateSchema, todoUpdateSchema, type TodoInput, type TodoUpdate } from '@/lib/validations/todo';
import { createNextRecurringTodo } from '@/lib/services/recurrenceService';
import { assertOwnedRow, assertBulkAffected } from '@/lib/services/dbGuard';
import type { TodoItemData } from '@/types/todo';

interface RawTodoRow {
  [key: string]: unknown;
  todo_tags?: Array<{ tags?: unknown }>;
}

/**
 * Maps raw Supabase todo rows with joined todo_tags into clean TodoItemData objects.
 */
export function mapTodoWithTags(rows: unknown[]): TodoItemData[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => {
    const raw = item as RawTodoRow;
    return {
      ...(raw as unknown as TodoItemData),
      tags: raw.todo_tags ? raw.todo_tags.map((tt) => tt.tags).filter(Boolean) : [],
    };
  }) as TodoItemData[];
}

/**
 * Fetches active (non-deleted) todos with pagination and tag join.
 * Implements fallback query if todo_tags table/relation is not yet migrated.
 */
export async function fetchActiveTodos(
  supabase: SupabaseClient,
  page = 1,
  pageSize = 50
): Promise<{ todos: TodoItemData[]; total: number; page: number; pageSize: number }> {
  const safePage = Math.max(1, Math.floor(page));
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  let data: unknown[] | null = null;
  let count: number | null = null;

  // Try query with JOIN to todo_tags
  const result = await supabase
    .from('todos')
    .select('*, todo_tags(tags(*))', { count: 'exact' })
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (result.error) {
    // Fallback: If todo_tags relation is missing, query todos alone
    const fallbackResult = await supabase
      .from('todos')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (fallbackResult.error) throw fallbackResult.error;
    data = fallbackResult.data;
    count = fallbackResult.count;
  } else {
    data = result.data;
    count = result.count;
  }

  const mapped = mapTodoWithTags(data || []);
  return { todos: mapped, total: count || 0, page: safePage, pageSize };
}

/**
 * Fetches soft-deleted todos in trash.
 */
export async function fetchTrashTodos(supabase: SupabaseClient): Promise<TodoItemData[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return (data as TodoItemData[]) || [];
}

/**
 * Creates a new todo item and links tags.
 */
export async function createTodo(
  supabase: SupabaseClient,
  userId: string,
  input: TodoInput & { tag_ids?: string[] }
): Promise<TodoItemData> {
  const { tag_ids, ...rawInput } = input;
  const validated = todoCreateSchema.parse(rawInput);

  const { data, error } = await supabase
    .from('todos')
    .insert({
      ...validated,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  if (tag_ids && tag_ids.length > 0) {
    const tagRows = tag_ids.map((tag_id) => ({ todo_id: data.id, tag_id }));
    await supabase.from('todo_tags').insert(tagRows);
  }

  return data as TodoItemData;
}

/**
 * Updates an existing todo and synchronizes tags if specified.
 */
export async function updateTodo(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  update: TodoUpdate,
  tag_ids?: string[]
): Promise<void> {
  // Review fix (#5): updateTodo trước đây đưa `update` thẳng vào DB không qua Zod —
  // checklist title HTML bypass sanitize (create có parse, update không).
  const validated = todoUpdateSchema.parse(update);

  const { data, error } = await supabase
    .from('todos')
    .update(validated)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  assertOwnedRow(data, 'updateTodo');

  if (tag_ids !== undefined) {
    const { error: delError } = await supabase.from('todo_tags').delete().eq('todo_id', id);
    if (delError) throw delError;
    if (tag_ids.length > 0) {
      const tagRows = tag_ids.map((tag_id) => ({ todo_id: id, tag_id }));
      const { error: tagError } = await supabase.from('todo_tags').insert(tagRows);
      if (tagError) throw tagError;
    }
  }
}

/**
 * Toggles a todo completion status and triggers recurrence if applicable.
 */
export async function toggleTodoCompletion(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  is_completed: boolean,
  currentTodo?: TodoItemData
): Promise<void> {
  const { data, error } = await supabase
    .from('todos')
    .update({ is_completed, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  assertOwnedRow(data, 'toggleTodoCompletion');

  // Handle recurrence if completing a task with recurrence_rule
  if (is_completed && currentTodo?.recurrence_rule && userId) {
    await createNextRecurringTodo(supabase, currentTodo, userId);
  }
}

/**
 * Reorders multiple todos atomically and checks for PostgREST errors.
 */
export async function reorderTodos(
  supabase: SupabaseClient,
  userId: string,
  orderedIds: string[]
): Promise<void> {
  const boundedIds = orderedIds.slice(0, 1000);
  const updates = boundedIds.map((id, index) =>
    supabase.from('todos').update({ sort_order: index }).eq('id', id).eq('user_id', userId).select('id')
  );

  const results = await Promise.allSettled(updates);
  const failed = results.filter(
    (r) =>
      r.status === 'rejected' ||
      (r.status === 'fulfilled' &&
        ((r.value as { error?: unknown })?.error ||
          ((r.value as { data?: unknown[] })?.data?.length ?? 1) === 0))
  );

  if (failed.length > 0) {
    throw new Error(`Reorder failed for ${failed.length}/${boundedIds.length} items`);
  }
}

/**
 * Increments pomodoro focus count for a given todo.
 */
export async function incrementPomodoro(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { data } = await supabase
    .from('todos')
    .select('pomodoro_count')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  const currentCount = data?.pomodoro_count || 0;
  const { data: updated, error } = await supabase
    .from('todos')
    .update({ pomodoro_count: currentCount + 1 })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  assertOwnedRow(updated, 'incrementPomodoro');
}

/**
 * Bulk completes selected todos and spawns next recurrence cycles.
 */
export async function bulkCompleteTodos(
  supabase: SupabaseClient,
  userId: string,
  ids: string[]
): Promise<void> {
  // 1. Fetch any recurring tasks in ids to generate their next cycles
  const { data: recurringTasks } = await supabase
    .from('todos')
    .select('*')
    .in('id', ids)
    .eq('user_id', userId)
    .not('recurrence_rule', 'is', null);

  // 2. Mark selected tasks as completed
  const { data, error } = await supabase
    .from('todos')
    .update({ is_completed: true, updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  assertBulkAffected(data, ids, 'bulkCompleteTodos');

  // 3. Generate next occurrence for each recurring task
  if (recurringTasks && recurringTasks.length > 0 && userId) {
    for (const task of recurringTasks) {
      await createNextRecurringTodo(supabase, task, userId);
    }
  }
}

/**
 * Bulk soft deletes todos.
 */
export async function bulkDeleteTodos(
  supabase: SupabaseClient,
  userId: string,
  ids: string[]
): Promise<void> {
  const { data, error } = await supabase
    .from('todos')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  assertBulkAffected(data, ids, 'bulkDeleteTodos');
}

/**
 * Bulk updates priority.
 */
export async function bulkUpdatePriority(
  supabase: SupabaseClient,
  userId: string,
  ids: string[],
  priority: 'low' | 'medium' | 'high'
): Promise<void> {
  const { data, error } = await supabase
    .from('todos')
    .update({ priority, updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  assertBulkAffected(data, ids, 'bulkUpdatePriority');
}

/**
 * Soft deletes a todo item (moves to trash).
 */
export async function softDeleteTodo(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { data, error } = await supabase
    .from('todos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  assertOwnedRow(data, 'softDeleteTodo');
}

/**
 * Restores a todo item from trash.
 */
export async function restoreTodo(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { data, error } = await supabase
    .from('todos')
    .update({ deleted_at: null })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  assertOwnedRow(data, 'restoreTodo');
}

/**
 * Permanently deletes a todo item.
 */
export async function permanentDeleteTodo(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  assertOwnedRow(data, 'permanentDeleteTodo');
}
