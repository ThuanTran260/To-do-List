'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { tagSchema } from '@/lib/validations/tag';

export interface TagData {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export function useTags() {
  const supabase = createClient();

  return useQuery<TagData[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const validated = tagSchema.parse({ name, color });

      const existingTags = queryClient.getQueryData<TagData[]>(['tags']) || [];
      const existing = existingTags.find(
        (t) => t.name.toLowerCase() === validated.name.toLowerCase()
      );
      if (existing) {
        return existing;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Vui lòng đăng nhập');

      const { data, error } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          name: validated.name,
          color: validated.color || '#6366f1',
        })
        .select()
        .single();

      if (error) {
        const pgError = error as { code?: string; message?: string };
        if (
          pgError.code === '23505' ||
          pgError.message?.includes('duplicate key') ||
          pgError.message?.includes('idx_tags_user_id_lower_name')
        ) {
          const { data: existingTag } = await supabase
            .from('tags')
            .select('*')
            .eq('user_id', user.id)
            .ilike('name', validated.name)
            .single();
          if (existingTag) return existingTag as TagData;
        }
        throw error;
      }
      return data as TagData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
