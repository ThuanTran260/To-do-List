import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * FIX MD-06: Filter realtime subscription by user_id for notes table
 * (registered in supabase_realtime via 20260824000000_notes_schema.sql).
 */
export function useRealtimeNotes(userId?: string) {
  const queryClient = useQueryClient();
  const [resolvedUserId, setResolvedUserId] = useState<string | undefined>(userId);

  useEffect(() => {
    if (userId) {
      setResolvedUserId(userId);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        setResolvedUserId(user.id);
      }
    });
  }, [userId]);

  useEffect(() => {
    if (!resolvedUserId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notes-realtime-${resolvedUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${resolvedUserId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notes'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedUserId, queryClient]);
}
