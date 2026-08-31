import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { NoteInput, NoteUpdate } from '@/lib/validations/note';
import { clearLocalDraft } from '@/lib/notesDraftSync';
import {
  fetchActiveNotes,
  fetchTrashNotes,
  createNote,
  updateNote,
  togglePinNote,
  changeNoteColor,
  softDeleteNote,
  restoreNote,
  permanentDeleteNote,
  type FetchActiveNotesOptions,
} from '@/lib/services/noteService';
import type { Note } from '@/types/note';

export type { Note };
export type UseNotesOptions = FetchActiveNotesOptions;

// Fetch active notes with tags
export function useNotes(options: UseNotesOptions = {}) {
  const { searchQuery, tagId, color, isArchived = false } = options;

  return useQuery({
    queryKey: ['notes', 'active', { searchQuery, tagId, color, isArchived }],
    queryFn: async () => {
      const supabase = createClient();
      return fetchActiveNotes(supabase, options);
    },
  });
}

// Fetch trash (soft-deleted) notes
export function useTrashNotes(enabled: boolean = true) {
  return useQuery({
    queryKey: ['notes', 'trash'],
    queryFn: async () => {
      const supabase = createClient();
      return fetchTrashNotes(supabase);
    },
    enabled,
  });
}

// Create Note mutation
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NoteInput & { tag_ids?: string[] }) => {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Bạn cần đăng nhập để tạo ghi chú.');
      }

      return createNote(supabase, user.id, input);
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

      return updateNote(supabase, user.id, id, rawUpdate, tag_ids);
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
      return togglePinNote(supabase, id, is_pinned);
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
      return changeNoteColor(supabase, id, color);
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
      return softDeleteNote(supabase, id);
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
      return restoreNote(supabase, id);
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
      return permanentDeleteNote(supabase, id);
    },
    onSuccess: (id) => {
      clearLocalDraft(id);
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
    },
  });
}
