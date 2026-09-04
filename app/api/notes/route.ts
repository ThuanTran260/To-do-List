import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { withAuth } from '@/lib/api/withAuth';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { validateCsrfToken } from '@/lib/security/csrf';
import { noteCreateSchema } from '@/lib/validations/note';
import { sanitizeHtmlServer } from '@/lib/sanitize/serverSanitize';

const createBodySchema = noteCreateSchema.extend({
  tag_ids: z.array(z.string().uuid()).optional(),
});

export const POST = withAuth(async (req, user, supabase) => {
  if (!checkRateLimit(`notes:write:${user.id}`, 60, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const cookieStore = await cookies();
  const headerToken = req.headers.get('x-csrf-token');
  if (!headerToken || !validateCsrfToken(headerToken, cookieStore.get('csrf-token')?.value || '')) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid payload' },
      { status: 400 }
    );
  }

  const { tag_ids, ...raw } = parsed.data;

  try {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...raw,
        content: sanitizeHtmlServer(raw.content),
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('[api/notes] insert failed', { error: error?.message });
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    if (tag_ids && tag_ids.length > 0) {
      // Review fix (#6): verify tag_ids thuộc về user trước khi link — RLS note_tags
      // chỉ check phía note, attacker đoán được UUID tag nạn nhân có thể gắn ké.
      const { data: ownedTags } = await supabase
        .from('tags')
        .select('id')
        .in('id', tag_ids)
        .eq('user_id', user.id);
      const ownedIds = new Set((ownedTags || []).map((t: { id: string }) => t.id));
      if (ownedIds.size !== tag_ids.length) {
        return NextResponse.json({ error: 'Invalid tags' }, { status: 400 });
      }
      const { error: tagError } = await supabase
        .from('note_tags')
        .insert(tag_ids.map((tag_id) => ({ note_id: data.id, tag_id })));
      if (tagError) console.error('[api/notes] tag link failed', { error: tagError.message });
    }

    return NextResponse.json({ note: data }, { status: 201 });
  } catch (err) {
    console.error('[api/notes] unexpected', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
});
