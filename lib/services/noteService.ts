import type { SupabaseClient } from '@supabase/supabase-js';
import { noteCreateSchema, type NoteInput, type NoteUpdate } from '@/lib/validations/note';
import { sanitizeHtml } from '@/lib/clientSanitize';
import { csrfFetch } from '@/lib/security/csrfClient';
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
 * Creates a new note via server API (E-H1).
 * Server validates (Zod) + sanitizes HTML + enforces user_id — client-side
 * sanitize alone is bypassable by direct API calls, so writes go through
 * POST /api/notes. Client pre-validates for friendly errors.
 */
export async function createNote(
  input: NoteInput & { tag_ids?: string[] }
): Promise<Note> {
  const { tag_ids, ...rawInput } = input;
  noteCreateSchema.parse(rawInput);

  const res = await csrfFetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new Error('Bạn cần đăng nhập để tạo ghi chú.');
  if (res.status === 429) throw new Error('Thao tác quá nhanh, vui lòng thử lại sau.');
  // Review fix (#10): 403 CSRF → hướng dẫn refresh; body non-JSON → generic (không throw raw TypeError ra UI).
  if (res.status === 403) throw new Error('Phiên đã hết hạn, vui lòng tải lại trang rồi thử lại.');
  if (!res.ok) throw new Error('Không thể tạo ghi chú.');
  let note: Note;
  try {
    ({ note } = (await res.json()) as { note: Note });
  } catch {
    throw new Error('Không thể tạo ghi chú.');
  }
  if (!note?.id) throw new Error('Không thể tạo ghi chú.');
  return note;
}

/**
 * Updates an existing note via server API (E-H1).
 */
export async function updateNote(
  id: string,
  rawUpdate: NoteUpdate,
  tag_ids?: string[]
): Promise<Note> {
  const res = await csrfFetch(`/api/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...rawUpdate, ...(tag_ids !== undefined ? { tag_ids } : {}) }),
  });
  if (res.status === 401) throw new Error('Bạn cần đăng nhập để cập nhật ghi chú.');
  if (res.status === 429) throw new Error('Thao tác quá nhanh, vui lòng thử lại sau.');
  if (res.status === 403) throw new Error('Phiên đã hết hạn, vui lòng tải lại trang rồi thử lại.');
  if (!res.ok) throw new Error('Không thể lưu ghi chú.');
  let note: Note;
  try {
    ({ note } = (await res.json()) as { note: Note });
  } catch {
    throw new Error('Không thể lưu ghi chú.');
  }
  if (!note?.id) throw new Error('Không thể lưu ghi chú.');
  return note;
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
