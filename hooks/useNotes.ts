import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { NoteInput, NoteUpdate } from '@/lib/validations/note';
import { clearLocalDraft } from '@/lib/notesDraftSync';
import { useAuth } from '@/hooks/useAuth';
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
    retry: 1,
  });
}

// Create Note mutation
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NoteInput & { tag_ids?: string[] }) => {
      return createNote(input);
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
      const { id, lastKnownUpdatedAt: _lastKnownUpdatedAt, tag_ids, ...rawUpdate } = payload;
      return updateNote(id, rawUpdate, tag_ids);
    },
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: ['notes', 'active'] });

      // Optimistically update existing note in all active queries
      queryClient.setQueriesData<{ notes?: Note[]; pinnedNotes?: Note[]; otherNotes?: Note[] }>(
        { queryKey: ['notes', 'active'] },
        (old) => {
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
        }
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'active'] });
    },
  });
}

// Toggle Pin mutation
export function useTogglePinNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Bạn cần đăng nhập.');
      return togglePinNote(supabase, user.id, id, is_pinned);
    },
    onMutate: async ({ id, is_pinned }) => {
      await queryClient.cancelQueries({ queryKey: ['notes', 'active'] });

      queryClient.setQueriesData<{ notes?: Note[]; pinnedNotes?: Note[]; otherNotes?: Note[] }>(
        { queryKey: ['notes', 'active'] },
        (old) => {
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
        }
      );
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Bạn cần đăng nhập.');
      return changeNoteColor(supabase, user.id, id, color);
    },
    onMutate: async ({ id, color }) => {
      await queryClient.cancelQueries({ queryKey: ['notes', 'active'] });

      queryClient.setQueriesData<{ notes?: Note[]; pinnedNotes?: Note[]; otherNotes?: Note[] }>(
        { queryKey: ['notes', 'active'] },
        (old) => {
          if (!old?.notes) return old;
          const updatedNotes = old.notes.map((n: Note) =>
            n.id === id ? { ...n, color: color as Note['color'], updated_at: new Date().toISOString() } : n
          );
          return {
            ...old,
            notes: updatedNotes,
            pinnedNotes: updatedNotes.filter((n: Note) => n.is_pinned),
            otherNotes: updatedNotes.filter((n: Note) => !n.is_pinned),
          };
        }
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'active'] });
    },
  });
}

// Soft-delete Note mutation
export function useSoftDeleteNote() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Bạn cần đăng nhập.');
      return softDeleteNote(supabase, user.id, id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });

      // Optimistic eviction from active cache
      queryClient.setQueriesData<{ notes?: Note[]; pinnedNotes?: Note[]; otherNotes?: Note[]; total?: number }>(
        { queryKey: ['notes', 'active'] },
        (old) => {
          if (!old?.notes) return old;
          const remaining = old.notes.filter((n: Note) => n.id !== id);
          return {
            ...old,
            notes: remaining,
            pinnedNotes: remaining.filter((n: Note) => n.is_pinned),
            otherNotes: remaining.filter((n: Note) => !n.is_pinned),
            total: Math.max(0, (old.total ?? 1) - 1),
          };
        }
      );
    },
    onSuccess: (deletedNote) => {
      clearLocalDraft(authUser?.id ?? deletedNote.user_id ?? null, deletedNote.id);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Bạn cần đăng nhập.');
      return restoreNote(supabase, user.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

// Permanent Delete Note mutation
export function usePermanentDeleteNote() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Bạn cần đăng nhập.');
      return permanentDeleteNote(supabase, user.id, id);
    },
    onSuccess: (id) => {
      clearLocalDraft(authUser?.id ?? null, id);
      queryClient.invalidateQueries({ queryKey: ['notes', 'trash'] });
    },
  });
}
