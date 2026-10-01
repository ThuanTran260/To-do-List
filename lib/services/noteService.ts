import type { SupabaseClient } from '@supabase/supabase-js';
import { noteCreateSchema, type NoteInput, type NoteUpdate } from '@/lib/validations/note';
import { csrfFetch } from '@/lib/security/csrfClient';
import { escapePostgrestLike } from '@/lib/search';
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

  // E-M10: shared escape helper — strip ký tự phá vỡ .or() parse (,()%"'_ etc),
  // cap 100 ký tự; escape rỗng → skip .or() (tránh ilike.%% match-all + fallback bỏ filter).
  if (searchQuery && searchQuery.trim().length > 0) {
    const escaped = escapePostgrestLike(searchQuery.trim());
    if (escaped.length > 0) {
      query = query.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`);
    }
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
 * Purges notes soft-deleted more than 30 days ago for the user.
 * Deletes database rows in chunks of 100.
 */
export async function purgeExpiredTrashNotes(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: expired, error: fetchError } = await supabase
    .from('notes')
    .select('id')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff)
    .eq('user_id', userId)
    .limit(500);

  if (fetchError || !expired || expired.length === 0) {
    return 0;
  }

  const CHUNK_SIZE = 100;
  const ids = (expired as Array<{ id: string }>).map((item) => item.id).filter(Boolean);
  let purgedCount = 0;

  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const { count, error: deleteError } = await supabase
      .from('notes')
      .delete({ count: 'exact' })
      .in('id', chunk)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('[trash] Failed to delete batch of expired notes', deleteError);
    } else {
      purgedCount += count ?? chunk.length;
    }
  }

  return purgedCount;
}

/**
 * Fetches trash notes within 30 days.
 * Triggers background non-blocking fire-and-forget purge of older trash notes.
 */
export async function fetchTrashNotes(
  supabase: SupabaseClient,
  userId?: string
): Promise<Note[]> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  void (async () => {
    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: authData } = await supabase.auth.getUser();
        targetUserId = authData.user?.id;
      }
      if (targetUserId) {
        await purgeExpiredTrashNotes(supabase, targetUserId);
      }
    } catch (purgeErr) {
      console.error('[trash] background purge notes failed', purgeErr);
    }
  })();

  const { data, error } = await supabase
    .from('notes')
    .select('*, note_tags(tags(*))')
    .not('deleted_at', 'is', null)
    .gte('deleted_at', cutoff)
    .order('deleted_at', { ascending: false });

  if (error) {
    // Fallback query
    const fallback = await supabase
      .from('notes')
      .select('*')
      .not('deleted_at', 'is', null)
      .gte('deleted_at', cutoff)
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
  const { tag_ids: _tag_ids, ...rawInput } = input;
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
