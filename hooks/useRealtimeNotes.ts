import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * FIX MD-06: Filter realtime subscription by user_id for notes table.
 */
export function useRealtimeNotes(userId?: string) {
  const queryClient = useQueryClient();
  const [authUserId, setAuthUserId] = useState<string | undefined>();

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
      .channel(`notes-realtime-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${targetUserId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notes'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId, queryClient]);
}
