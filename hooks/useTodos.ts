import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { TodoInput, TodoUpdate } from '@/lib/validations/todo';
import { log } from '@/lib/logger';
import {
  fetchActiveTodos,
  fetchTrashTodos,
  createTodo,
  updateTodo,
  toggleTodoCompletion,
  reorderTodos,
  incrementPomodoro,
  bulkCompleteTodos,
  bulkDeleteTodos,
  bulkUpdatePriority,
  softDeleteTodo,
  restoreTodo,
  permanentDeleteTodo,
} from '@/lib/services/todoService';
import type { TodoItemData, ChecklistItem } from '@/types/todo';

export type { TodoItemData, ChecklistItem };

// Fetch active (non-deleted) todos
export function useTodos(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ['todos', 'active', page],
    queryFn: async () => {
      const supabase = createClient();
      return fetchActiveTodos(supabase, page, pageSize);
    },
  });
}

// Fetch trash (soft-deleted) todos
export function useTrashTodos(enabled: boolean = true) {
  return useQuery({
    queryKey: ['todos', 'trash'],
    queryFn: async () => {
      const supabase = createClient();
      return fetchTrashTodos(supabase);
    },
    enabled,
  });
}

// Create todo with optimistic update
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TodoInput & { tag_ids?: string[] }) => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Bạn cần đăng nhập để tạo công việc.');
      }
      return createTodo(supabase, user.id, input);
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
        checklist: (newTodo.checklist as any) || [],
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
      const { data: { user } } = await supabase.auth.getUser();
      await toggleTodoCompletion(supabase, id, is_completed, currentTodo, user?.id);
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
      await updateTodo(supabase, id, update, tag_ids);
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
      await reorderTodos(supabase, orderedIds);
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
      await incrementPomodoro(supabase, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

// Bulk complete/delete/priority mutations
export function useBulkActions() {
  const queryClient = useQueryClient();

  const bulkComplete = useMutation({
    mutationFn: async (ids: string[]) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await bulkCompleteTodos(supabase, ids, user?.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const supabase = createClient();
      await bulkDeleteTodos(supabase, ids);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const bulkPriority = useMutation({
    mutationFn: async ({ ids, priority }: { ids: string[]; priority: 'low' | 'medium' | 'high' }) => {
      const supabase = createClient();
      await bulkUpdatePriority(supabase, ids, priority);
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
      await softDeleteTodo(supabase, id);
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
      await restoreTodo(supabase, id);
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
      await permanentDeleteTodo(supabase, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
