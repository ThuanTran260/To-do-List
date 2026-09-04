'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

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
export function useRealtimeCategories(userId?: string) {
  const queryClient = useQueryClient();
  const [authUserId, setAuthUserId] = useState<string | undefined>();

  // Self-resolve userId (mẫu useRealtimeTodos): caller không truyền vẫn có filter,
  // tránh subscription lặng lẽ không chạy hoặc nhận event cross-user.
  useEffect(() => {
    if (userId) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        setAuthUserId(user.id);
      }
    });
  }, [userId]);

  const targetUserId = userId || authUserId;

  useEffect(() => {
    if (!targetUserId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`categories-realtime-${targetUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${targetUserId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId, queryClient]);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Bạn cần đăng nhập');
      const { data, error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id).select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Xoá thất bại: không tìm thấy hoặc không có quyền.');
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
