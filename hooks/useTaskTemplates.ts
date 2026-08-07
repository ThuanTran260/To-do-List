'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { TaskTemplate } from '@/types/todo';

export function useTaskTemplates() {
  const supabase = createClient();

  return useQuery<TaskTemplate[]>({
    queryKey: ['task_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateTaskTemplate() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ name, template_data }: { name: string; template_data: TaskTemplate['template_data'] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          user_id: user.id,
          name,
          template_data,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_templates'] });
    },
  });
}

export function useDeleteTaskTemplate() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_templates'] });
    },
  });
}
