'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

export interface CategoryItemData {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

/**
 * Supabase Realtime Subscription hook for categories.
 * Call this once in top-level list components.
 */
export function useRealtimeCategories() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const channelId = `categories_realtime_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Fetches categories list via React Query.
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as CategoryItemData[]) || [];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Bạn cần đăng nhập');

      // Client-side duplicate check (case-insensitive)
      const existing = queryClient.getQueryData<CategoryItemData[]>(['categories']) || [];
      const isDuplicate = existing.some(
        (c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (isDuplicate) {
        throw new Error(`Danh mục "${name.trim()}" đã tồn tại.`);
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: name.trim(),
          color: color || '#6366f1',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CategoryItemData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

// WCAG Contrast calculation for Category Badges
export function getReadableTextColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#0f172a' : '#ffffff';
}
