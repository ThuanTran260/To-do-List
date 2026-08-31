import type { SupabaseClient } from '@supabase/supabase-js';
import { getNextOccurrenceDate } from '@/lib/recurrence';

/**
 * L-03 fix: single source cho logic tạo next occurrence của recurring task.
 * Trước đây 2 khối copy-paste trong useToggleTodo và useBulkActions.bulkComplete
 * diverge (một bên có fallback tag fetch, một bên không).
 *
 * Decision #2 (2026-08-31): overdue N kỳ chỉ sinh 1 bản duy nhất
 * `nextDate = rule.after(now, false)` — không catch-up N bản.
 */

interface RecurringTodoLike {
  id: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  due_date?: string | null;
  recurrence_rule?: string | null;
  recurrence_end?: string | null;
  category_id?: string | null;
  checklist?: unknown[] | null;
  tags?: { id: string }[] | null;
}

/**
 * Tạo todo kế tiếp cho task recurring vừa hoàn thành.
 * Returns new todo id hoặc null (hết hạn / rule invalid / insert lỗi).
 */
export async function createNextRecurringTodo(
  supabase: SupabaseClient,
  currentTodo: RecurringTodoLike,
  userId: string
): Promise<{ id: string } | null> {
  if (!currentTodo.recurrence_rule) return null;

  const nextDate = getNextOccurrenceDate(
    currentTodo.recurrence_rule,
    currentTodo.due_date ? new Date(currentTodo.due_date) : new Date(),
    currentTodo.recurrence_end
  );
  if (!nextDate) return null;

  const { data: newTodo, error: insertError } = await supabase
    .from('todos')
    .insert({
      title: currentTodo.title,
      description: currentTodo.description,
      priority: currentTodo.priority,
      due_date: nextDate.toISOString(),
      user_id: userId,
      recurrence_rule: currentTodo.recurrence_rule,
      recurrence_end: currentTodo.recurrence_end,
      parent_id: currentTodo.id,
      category_id: currentTodo.category_id,
      // Clone checklist nhưng reset trạng thái is_done
      checklist: currentTodo.checklist
        ? currentTodo.checklist.map((item) => ({
            ...(item as Record<string, unknown>),
            is_done: false,
          }))
        : [],
    })
    .select('id')
    .single();

  if (insertError || !newTodo) return null;

  await cloneTodoTags(supabase, currentTodo, newTodo.id);
  return newTodo;
}

/**
 * Clone tags: ưu tiên tags đã load trên object, fallback fetch từ todo_tags
 * (tag mapping DRY — thay 2 phiên bản diverge).
 */
async function cloneTodoTags(
  supabase: SupabaseClient,
  currentTodo: RecurringTodoLike,
  newTodoId: string
): Promise<void> {
  let tagIds: string[] = [];

  if (currentTodo.tags && currentTodo.tags.length > 0) {
    tagIds = currentTodo.tags.map((t) => t.id);
  } else {
    const { data: existingTags } = await supabase
      .from('todo_tags')
      .select('tag_id')
      .eq('todo_id', currentTodo.id);
    tagIds = existingTags?.map((row) => row.tag_id) ?? [];
  }

  if (tagIds.length === 0) return;

  const tagRows = tagIds.map((tagId) => ({ todo_id: newTodoId, tag_id: tagId }));
  const { error } = await supabase.from('todo_tags').insert(tagRows);
  if (error) {
    console.error('[recurrenceService] tag clone failed', { newTodoId, error: error.message });
  }
}
