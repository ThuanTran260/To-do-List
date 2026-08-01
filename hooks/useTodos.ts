import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { todoCreateSchema, type TodoInput, type TodoUpdate } from '@/lib/validations/todo';
import { log } from '@/lib/logger';

// KHÔNG dùng singleton — luôn gọi createClient() bên trong query/mutation
// để đảm bảo JWT token trong cookie được đọc tại thời điểm request

export interface TodoItemData {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_vital?: boolean;
  category_id?: string | null;
  image_url?: string | null;
}

// Fetch active (non-deleted) todos
export function useTodos(page = 1, pageSize = 30) {
  return useQuery({
    queryKey: ['todos', 'active', page],
    queryFn: async () => {
      const supabase = createClient();
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('todos')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { todos: (data as TodoItemData[]) || [], total: count || 0, page, pageSize };
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
    mutationFn: async (input: TodoInput) => {
      const supabase = createClient();
      const validated = todoCreateSchema.parse(input);

      // Lấy user_id hiện tại từ Auth session
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

// Toggle completed status with optimistic update
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update({ is_completed })
        .eq('id', id);
      if (error) throw error;
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
    mutationFn: async ({ id, update }: { id: string; update: TodoUpdate }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
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
