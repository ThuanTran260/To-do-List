import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { todoCreateSchema, type TodoInput, type TodoUpdate } from '@/lib/validations/todo';
import { log } from '@/lib/logger';
import { getNextOccurrenceDate } from '@/lib/recurrence';
import type { TodoItemData, ChecklistItem } from '@/types/todo';

export type { TodoItemData, ChecklistItem };

// Fetch active (non-deleted) todos
export function useTodos(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ['todos', 'active', page],
    queryFn: async () => {
      const supabase = createClient();
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let data: any = null;
      let error: any = null;
      let count: number | null = null;

      // Thử query có JOIN với todo_tags
      const result = await supabase
        .from('todos')
        .select('*, todo_tags(tags(*))', { count: 'exact' })
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (result.error) {
        // Fallback: Nếu Supabase chưa chạy SQL Migration (thiếu bảng todo_tags/relationship),
        // query fallback chỉ lấy bảng todos để ứng dụng KHÔNG bị lỗi/crash với to-do cũ.
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

      const mapped = (data || []).map((item: any) => ({
        ...item,
        tags: item.todo_tags ? item.todo_tags.map((tt: any) => tt.tags).filter(Boolean) : [],
      }));

      return { todos: mapped as TodoItemData[], total: count || 0, page, pageSize };
    },
  });
}

// Fetch trash (soft-deleted) todos
export function useTrashTodos() {
  return useQuery({
    queryKey: ['todos', 'trash'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return (data as TodoItemData[]) || [];
    },
  });
}

// Create todo with optimistic update
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TodoInput & { tag_ids?: string[] }) => {
      const supabase = createClient();
      const { tag_ids, ...rawInput } = input;
      const validated = todoCreateSchema.parse(rawInput);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Bạn cần đăng nhập để tạo công việc.');
      }

      const { data, error } = await supabase
        .from('todos')
        .insert({
          ...validated,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (tag_ids && tag_ids.length > 0) {
        const tagRows = tag_ids.map(tag_id => ({ todo_id: data.id, tag_id }));
        await supabase.from('todo_tags').insert(tagRows);
      }

      return data as TodoItemData;
    },
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previous = queryClient.getQueryData<{ todos: TodoItemData[]; total: number }>(['todos', 'active', 1]);
      
      const tempItem: TodoItemData = {
        id: 'temp-' + Date.now(),
        user_id: 'temp-user',
        title: newTodo.title,
        description: newTodo.description || null,
        is_completed: false,
        priority: newTodo.priority || 'medium',
        due_date: newTodo.due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        checklist: newTodo.checklist || [],
        recurrence_rule: newTodo.recurrence_rule || null,
      };

      queryClient.setQueryData(['todos', 'active', 1], (old: any) => ({
        ...old,
        total: (old?.total || 0) + 1,
        todos: [tempItem, ...(old?.todos || [])],
      }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(['todos', 'active', 1], context?.previous);
      log('error', 'Failed to create todo', { error: (err as Error).message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

// Toggle completed status with optimistic update + Recurring Task handler
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_completed, currentTodo }: { id: string; is_completed: boolean; currentTodo?: TodoItemData }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update({ is_completed, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      // Handle recurrence if completing a task with recurrence_rule
      if (is_completed && currentTodo?.recurrence_rule) {
        const nextDate = getNextOccurrenceDate(
          currentTodo.recurrence_rule,
          currentTodo.due_date ? new Date(currentTodo.due_date) : new Date(),
          currentTodo.recurrence_end
        );
        if (nextDate) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: newTodo, error: insertError } = await supabase
              .from('todos')
              .insert({
                title: currentTodo.title,
                description: currentTodo.description,
                priority: currentTodo.priority,
                due_date: nextDate.toISOString(),
                user_id: user.id,
                recurrence_rule: currentTodo.recurrence_rule,
                recurrence_end: currentTodo.recurrence_end,
                parent_id: currentTodo.id,
                category_id: currentTodo.category_id,
                checklist: currentTodo.checklist
                  ? currentTodo.checklist.map((item) => ({ ...item, is_done: false }))
                  : [],
              })
              .select()
              .single();

            if (!insertError && newTodo) {
              if (currentTodo.tags && currentTodo.tags.length > 0) {
                const tagRows = currentTodo.tags.map((tag) => ({
                  todo_id: newTodo.id,
                  tag_id: tag.id,
                }));
                await supabase.from('todo_tags').insert(tagRows);
              } else {
                const { data: existingTags } = await supabase
                  .from('todo_tags')
                  .select('tag_id')
                  .eq('todo_id', currentTodo.id);
                if (existingTags && existingTags.length > 0) {
                  const tagRows = existingTags.map((row) => ({
                    todo_id: newTodo.id,
                    tag_id: row.tag_id,
                  }));
                  await supabase.from('todo_tags').insert(tagRows);
                }
              }
            }
          }
        }
      }
    },
    onMutate: async ({ id, is_completed }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previous = queryClient.getQueryData(['todos', 'active', 1]);

      queryClient.setQueryData(['todos', 'active', 1], (old: any) => ({
        ...old,
        todos: old?.todos?.map((t: TodoItemData) =>
          t.id === id ? { ...t, is_completed } : t
        ),
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['todos', 'active', 1], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

// Update todo details
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, update, tag_ids }: { id: string; update: TodoUpdate; tag_ids?: string[] }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update(update)
        .eq('id', id);
      if (error) throw error;

      if (tag_ids !== undefined) {
        await supabase.from('todo_tags').delete().eq('todo_id', id);
        if (tag_ids.length > 0) {
          const tagRows = tag_ids.map(tag_id => ({ todo_id: id, tag_id }));
          await supabase.from('todo_tags').insert(tagRows);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

// Reorder todos (batch update sort_order)
export function useReorderTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const supabase = createClient();
      const updates = orderedIds.map((id, index) =>
        supabase.from('todos').update({ sort_order: index }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previous = queryClient.getQueryData(['todos', 'active', 1]);

      queryClient.setQueryData(['todos', 'active', 1], (old: any) => {
        if (!old?.todos) return old;
        const itemMap = new Map(old.todos.map((t: TodoItemData) => [t.id, t]));
        const newTodos: TodoItemData[] = [];
        orderedIds.forEach((id, idx) => {
          const item = itemMap.get(id) as TodoItemData | undefined;
          if (item) newTodos.push({ ...item, sort_order: idx });
        });
        // add remaining items not in orderedIds
        old.todos.forEach((t: TodoItemData) => {
          if (!orderedIds.includes(t.id)) newTodos.push(t);
        });
        return { ...old, todos: newTodos };
      });

      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

// Increment Pomodoro count
export function useIncrementPomodoro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { data } = await supabase.from('todos').select('pomodoro_count').eq('id', id).single();
      const currentCount = data?.pomodoro_count || 0;
      const { error } = await supabase
        .from('todos')
        .update({ pomodoro_count: currentCount + 1 })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

// Bulk complete/delete mutations
export function useBulkActions() {
  const queryClient = useQueryClient();

  const bulkComplete = useMutation({
    mutationFn: async (ids: string[]) => {
      const supabase = createClient();

      // 1. Fetch any recurring tasks in ids to generate their next cycles
      const { data: recurringTasks } = await supabase
        .from('todos')
        .select('*')
        .in('id', ids)
        .not('recurrence_rule', 'is', null);

      // 2. Mark selected tasks as completed
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: true, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;

      // 3. Generate next occurrence for each recurring task
      if (recurringTasks && recurringTasks.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const task of recurringTasks) {
            const nextDate = getNextOccurrenceDate(
              task.recurrence_rule!,
              task.due_date ? new Date(task.due_date) : new Date(),
              task.recurrence_end
            );
            if (nextDate) {
              const { data: newTodo } = await supabase
                .from('todos')
                .insert({
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  due_date: nextDate.toISOString(),
                  user_id: user.id,
                  recurrence_rule: task.recurrence_rule,
                  recurrence_end: task.recurrence_end,
                  parent_id: task.id,
                  category_id: task.category_id,
                  checklist: task.checklist
                    ? task.checklist.map((item: any) => ({ ...item, is_done: false }))
                    : [],
                })
                .select()
                .single();

              if (newTodo) {
                const { data: existingTags } = await supabase
                  .from('todo_tags')
                  .select('tag_id')
                  .eq('todo_id', task.id);
                if (existingTags && existingTags.length > 0) {
                  const tagRows = existingTags.map((row) => ({
                    todo_id: newTodo.id,
                    tag_id: row.tag_id,
                  }));
                  await supabase.from('todo_tags').insert(tagRows);
                }
              }
            }
          }
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const bulkPriority = useMutation({
    mutationFn: async ({ ids, priority }: { ids: string[]; priority: 'low' | 'medium' | 'high' }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update({ priority, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  return { bulkComplete, bulkDelete, bulkPriority };
}

// Soft delete todo (move to trash)
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previous = queryClient.getQueryData(['todos', 'active', 1]);

      queryClient.setQueryData(['todos', 'active', 1], (old: any) => ({
        ...old,
        total: Math.max(0, (old?.total || 1) - 1),
        todos: old?.todos?.filter((t: TodoItemData) => t.id !== id),
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['todos', 'active', 1], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

// Restore todo from trash
export function useRestoreTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update({ deleted_at: null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

// Permanent delete from trash
export function usePermanentDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
