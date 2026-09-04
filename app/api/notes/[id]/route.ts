import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { withAuth, type WithAuthSupabaseClient } from '@/lib/api/withAuth';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { validateCsrfToken } from '@/lib/security/csrf';
import { noteUpdateSchema } from '@/lib/validations/note';
import { sanitizeHtmlServer } from '@/lib/sanitize/serverSanitize';

const patchBodySchema = noteUpdateSchema.extend({
  tag_ids: z.array(z.string().uuid()).optional(),
});

export const PATCH = withAuth(
  async (
    req: Request,
    user: { id: string },
    supabase: WithAuthSupabaseClient,
    ctx: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await ctx.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid note id' }, { status: 400 });
    }

    if (!checkRateLimit(`notes:write:${user.id}`, 60, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const cookieStore = await cookies();
    const headerToken = req.headers.get('x-csrf-token');
    if (!headerToken || !validateCsrfToken(headerToken, cookieStore.get('csrf-token')?.value || '')) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid payload' },
        { status: 400 }
      );
    }

    const { tag_ids, ...rawUpdate } = parsed.data;
    if (typeof rawUpdate.content === 'string') {
      rawUpdate.content = sanitizeHtmlServer(rawUpdate.content);
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ ...rawUpdate, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error || !data) {
        console.error('[api/notes/:id] update failed', { id, error: error?.message });
        return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
      }

      if (tag_ids !== undefined) {
        await supabase.from('note_tags').delete().eq('note_id', id);
        if (tag_ids.length > 0) {
          const { error: tagError } = await supabase
            .from('note_tags')
            .insert(tag_ids.map((tag_id) => ({ note_id: id, tag_id })));
          if (tagError) console.error('[api/notes/:id] tag sync failed', { error: tagError.message });
        }
      }

      return NextResponse.json({ note: data });
    } catch (err) {
      console.error('[api/notes/:id] unexpected', err);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  }
);
