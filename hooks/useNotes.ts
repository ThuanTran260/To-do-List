import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { noteCreateSchema, type NoteInput, type NoteUpdate } from '@/lib/validations/note';
import { sanitizeHtml } from '@/lib/clientSanitize';
import { clearLocalDraft } from '@/lib/notesDraftSync';
import type { Note } from '@/types/note';

export type { Note };

interface UseNotesOptions {
  searchQuery?: string;
  tagId?: string;
  color?: string;
  isArchived?: boolean;
}

// Fetch active notes with tags
export function useNotes(options: UseNotesOptions = {}) {
  const { searchQuery, tagId, color, isArchived = false } = options;

  return useQuery({
    queryKey: ['notes', 'active', { searchQuery, tagId, color, isArchived }],
    queryFn: async () => {
      const supabase = createClient();

      let query = supabase
        .from('notes')
        .select('*, note_tags(tags(*))', { count: 'exact' })
        .is('deleted_at', null)
        .eq('is_archived', isArchived)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (color && color !== 'all') {
        query = query.eq('color', color);
      }

      // L-02 fix: searchQuery trước đây chỉ nằm trong queryKey, không bao giờ áp vào query
      if (searchQuery && searchQuery.trim().length > 0) {
        const escaped = searchQuery.trim().replace(/[%,()]/g, '');
        query = query.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`);
      }

      const result = await query;

      let data = result.data;
      if (result.error) {
        // Fallback: If note_tags relationship is missing or unmigrated, query notes alone
        const fallback = await supabase
          .from('notes')
          .select('*', { count: 'exact' })
          .is('deleted_at', null)
          .eq('is_archived', isArchived)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (fallback.error) throw fallback.error;
        data = fallback.data;
      }

      let mapped = (data || []).map((item: any) => ({
        ...item,
        tags: item.note_tags ? item.note_tags.map((nt: any) => nt.tags).filter(Boolean) : [],
      })) as Note[];

      // Filter by tag if selected
      if (tagId && tagId !== 'all') {
        mapped = mapped.filter((note) => note.tags?.some((t) => t.id === tagId));
      }

      return {
        notes: mapped,
        pinnedNotes: mapped.filter((n) => n.is_pinned),
        otherNotes: mapped.filter((n) => !n.is_pinned),
        total: mapped.length,
      };
    },
  });
}

// Fetch trash (soft-deleted) notes
export function useTrashNotes() {
  return useQuery({
    queryKey: ['notes', 'trash'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notes')
        .select('*, note_tags(tags(*))')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) {
        // Fallback
        const fallback = await supabase
          .from('notes')
          .select('*')
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false });

        if (fallback.error) throw fallback.error;
        return (fallback.data as Note[]) || [];
      }

      return (
        (data || []).map((item: any) => ({
          ...item,
          tags: item.note_tags ? item.note_tags.map((nt: any) => nt.tags).filter(Boolean) : [],
        })) as Note[]
      );
    },
  });
}

// Create Note mutation
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NoteInput & { tag_ids?: string[] }) => {
      const supabase = createClient();
      const { tag_ids, ...rawInput } = input;
      const validated = noteCreateSchema.parse(rawInput);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Bạn cần đăng nhập để tạo ghi chú.');
      }

      const { data, error } = await supabase
        .from('notes')
        .insert({
          ...validated,
          content: sanitizeHtml(validated.content),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Link tags if provided
      if (tag_ids && tag_ids.length > 0) {
        const rows = tag_ids.map((tagId) => ({
          note_id: data.id,
          tag_id: tagId,
        }));
        await supabase.from('note_tags').insert(rows);
      }

      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

// Update Note mutation with optimistic cache
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: { id: string; lastKnownUpdatedAt?: string } & NoteUpdate & { tag_ids?: string[] }
    ) => {
      const supabase = createClient();
      const { id, lastKnownUpdatedAt, tag_ids, ...rawUpdate } = payload;

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Bạn cần đăng nhập để cập nhật ghi chú.');
      }

      const updateData: any = {
        ...rawUpdate,
        updated_at: new Date().toISOString(),
      };

      if (updateData.content) {
        updateData.content = sanitizeHtml(updateData.content);
      }

      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update tags if tag_ids passed
      if (tag_ids !== undefined) {
        await supabase.from('note_tags').delete().eq('note_id', id);
        if (tag_ids.length > 0) {
          const rows = tag_ids.map((tagId) => ({
            note_id: id,
            tag_id: tagId,
          }));
          await supabase.from('note_tags').insert(rows);
        }
      }

      return data as Note;
    },
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: ['notes', 'active'] });

      // Optimistically update existing note in all active queries
      queryClient.setQueriesData({ queryKey: ['notes', 'active'] }, (old: any) => {
        if (!old?.notes) return old;
        const updatedNotes = old.notes.map((n: Note) =>
          n.id === newNote.id ? { ...n, ...newNote, updated_at: new Date().toISOString() } : n
        );
        return {
          ...old,
          notes: updatedNotes,
          pinnedNotes: updatedNotes.filter((n: Note) => n.is_pinned),
          otherNotes: updatedNotes.filter((n: Note) => !n.is_pinned),
        };
      });
    },
    onSuccess: (savedNote) => {
      clearLocalDraft(savedNote.id);
    },
  });
}

// Toggle Pin mutation
export function useTogglePinNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notes')
        .update({ is_pinned, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onMutate: async ({ id, is_pinned }) => {
      await queryClient.cancelQueries({ queryKey: ['notes', 'active'] });

      queryClient.setQueriesData({ queryKey: ['notes', 'active'] }, (old: any) => {
        if (!old?.notes) return old;
        const updatedNotes = old.notes.map((n: Note) =>
          n.id === id ? { ...n, is_pinned, updated_at: new Date().toISOString() } : n
        );
        return {
          ...old,
          notes: updatedNotes,
          pinnedNotes: updatedNotes.filter((n: Note) => n.is_pinned),
          otherNotes: updatedNotes.filter((n: Note) => !n.is_pinned),
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'active'] });
    },
  });
}

// Change Color mutation
export function useChangeNoteColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, color }: { id: string; color: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notes')
        .update({ color, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onMutate: async ({ id, color }) => {
      await queryClient.cancelQueries({ queryKey: ['notes', 'active'] });

      queryClient.setQueriesData({ queryKey: ['notes', 'active'] }, (old: any) => {
        if (!old?.notes) return old;
        const updatedNotes = old.notes.map((n: Note) =>
          n.id === id ? { ...n, color: color as any, updated_at: new Date().toISOString() } : n
        );
        return {
          ...old,
          notes: updatedNotes,
          pinnedNotes: updatedNotes.filter((n: Note) => n.is_pinned),
          otherNotes: updatedNotes.filter((n: Note) => !n.is_pinned),
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'active'] });
    },
  });
}

// Soft-delete Note mutation
export function useSoftDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });

      // Optimistic eviction from active cache
      queryClient.setQueriesData({ queryKey: ['notes', 'active'] }, (old: any) => {
        if (!old?.notes) return old;
        const remaining = old.notes.filter((n: Note) => n.id !== id);
        return {
          ...old,
          notes: remaining,
          pinnedNotes: remaining.filter((n: Note) => n.is_pinned),
          otherNotes: remaining.filter((n: Note) => !n.is_pinned),
          total: Math.max(0, old.total - 1),
        };
      });
    },
    onSuccess: (deletedNote) => {
      clearLocalDraft(deletedNote.id);
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
    },
  });
}

// Restore Note mutation
export function useRestoreNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notes')
        .update({ deleted_at: null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

// Permanent Delete Note mutation
export function usePermanentDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      clearLocalDraft(id);
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
    },
  });
}
