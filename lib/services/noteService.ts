import type { SupabaseClient } from '@supabase/supabase-js';
import { noteCreateSchema, type NoteInput, type NoteUpdate } from '@/lib/validations/note';
import { sanitizeHtml } from '@/lib/clientSanitize';
import { assertOwnedRow } from '@/lib/services/dbGuard';
import type { Note } from '@/types/note';

interface RawNoteRow {
  [key: string]: unknown;
  note_tags?: Array<{ tags?: unknown }>;
}

/**
 * Maps raw Supabase note rows with joined note_tags into clean Note objects.
 */
export function mapNoteWithTags(rows: unknown[]): Note[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((item) => {
    const raw = item as RawNoteRow;
    return {
      ...(raw as unknown as Note),
      tags: raw.note_tags ? raw.note_tags.map((nt) => nt.tags).filter(Boolean) : [],
    };
  }) as Note[];
}

export interface FetchActiveNotesOptions {
  searchQuery?: string;
  tagId?: string;
  color?: string;
  isArchived?: boolean;
}

/**
 * Fetches active notes with tag joins, search query escaping, and fallback query.
 */
export async function fetchActiveNotes(
  supabase: SupabaseClient,
  options: FetchActiveNotesOptions = {}
): Promise<{ notes: Note[]; pinnedNotes: Note[]; otherNotes: Note[]; total: number }> {
  const { searchQuery, tagId, color, isArchived = false } = options;

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

  // Escape PostgREST syntax special chars
  if (searchQuery && searchQuery.trim().length > 0) {
    const escaped = searchQuery.trim().replace(/[%,()"]/g, '');
    query = query.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`);
  }

  const result = await query;
  let data = result.data;

  if (result.error) {
    // Fallback: If note_tags relationship is missing, query notes alone
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

  let mapped = mapNoteWithTags(data || []);

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
}

/**
 * Fetches trash notes.
 */
export async function fetchTrashNotes(supabase: SupabaseClient): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*, note_tags(tags(*))')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    // Fallback query
    const fallback = await supabase
      .from('notes')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (fallback.error) throw fallback.error;
    return (fallback.data as Note[]) || [];
  }

  return mapNoteWithTags(data || []);
}

/**
 * Creates a new note with sanitized content and links tags.
 */
export async function createNote(
  supabase: SupabaseClient,
  userId: string,
  input: NoteInput & { tag_ids?: string[] }
): Promise<Note> {
  const { tag_ids, ...rawInput } = input;
  const validated = noteCreateSchema.parse(rawInput);

  const { data, error } = await supabase
    .from('notes')
    .insert({
      ...validated,
      content: sanitizeHtml(validated.content),
      user_id: userId,
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
}

/**
 * Updates an existing note.
 */
export async function updateNote(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  rawUpdate: NoteUpdate,
  tag_ids?: string[]
): Promise<Note> {
  const updateData: Record<string, unknown> = {
    ...rawUpdate,
    updated_at: new Date().toISOString(),
  };

  if (typeof updateData.content === 'string') {
    updateData.content = sanitizeHtml(updateData.content);
  }

  const { data, error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

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
}

/**
 * Toggles pin status for a note.
 */
export async function togglePinNote(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  is_pinned: boolean
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ is_pinned, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

/**
 * Changes note color.
 */
export async function changeNoteColor(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  color: string
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ color, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

/**
 * Soft deletes a note.
 */
export async function softDeleteNote(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

/**
 * Restores a note from trash.
 */
export async function restoreNote(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

/**
 * Permanently deletes a note.
 */
export async function permanentDeleteNote(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<string> {
  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');
  if (error) throw error;
  assertOwnedRow(data, 'permanentDeleteNote');
  return id;
}
