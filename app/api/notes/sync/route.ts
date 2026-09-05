import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/withAuth';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { noteUpdateSchema } from '@/lib/validations/note';
import { sanitizeHtmlServer } from '@/lib/sanitize/serverSanitize';

// S-05: UUID validation cho noteId + body size guard qua Zod schema
const bodySchema = z.object({
  noteId: z.string().uuid('Invalid noteId'),
  ...noteUpdateSchema.shape,
});

export const POST = withAuth(async (request, user, supabase) => {
  try {
    // MD-05: auth đã chạy trong withAuth — rateLimit SAU auth để tránh drain bucket chung.
    // CSRF check nằm trong withAuth option requireCsrf (E-M1, B10).
    // 60/phút: autosave debounce 600ms (~100 save/phút khi gõ liên tục) — 20/phút gây 429 khi soạn thảo (I-3).
    if (!checkRateLimit(`notes:sync:${user.id}`, 60, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid payload' },
        { status: 400 }
      );
    }

    const { noteId, ...rawUpdate } = parsed.data;

    // Defense-in-depth: sanitize HTML content server-side trước khi ghi DB
    // (client-side sanitize trong useNotes có thể bị bypass bằng direct API call)
    if (typeof rawUpdate.content === 'string') {
      rawUpdate.content = sanitizeHtmlServer(rawUpdate.content);
    }

    // parsed.data đã qua transform (sanitize title) từ noteUpdateSchema
    const { error: updateError } = await supabase
      .from('notes')
      .update({
        ...rawUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .eq('user_id', user.id);

    // MD-14: log chi tiết server-side, trả generic message cho client
    if (updateError) {
      console.error('[notes/sync] update failed', { noteId, error: updateError.message });
      return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[notes/sync] unexpected', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}, { requireCsrf: true });
