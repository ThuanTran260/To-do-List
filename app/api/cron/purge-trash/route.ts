import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function handlePurge(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('[cron/purge-trash] CRON_SECRET not configured');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !timingSafeEqualStr(authHeader, `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey || url.includes('placeholder')) {
      return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 500 });
    }

    const supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const startTime = Date.now();
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Query expired todos
    const { data: expiredTodos, error: todosError } = await supabase
      .from('todos')
      .select('id, image_path, image_thumb_path')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoff)
      .limit(500);

    if (todosError) {
      console.error('[cron/purge-trash] Failed to query expired todos', todosError);
      return NextResponse.json({ error: 'Failed to query expired todos' }, { status: 500 });
    }

    let purgedTodos = 0;
    if (expiredTodos && expiredTodos.length > 0) {
      const imagePaths: string[] = [];
      for (const item of expiredTodos as Array<{ id: string; image_path?: string | null; image_thumb_path?: string | null }>) {
        if (item.image_path) imagePaths.push(item.image_path);
        if (item.image_thumb_path) imagePaths.push(item.image_thumb_path);
      }

      if (imagePaths.length > 0) {
        try {
          const distinctPaths = Array.from(new Set(imagePaths));
          const { error: storageError } = await supabase.storage
            .from('task-attachments')
            .remove(distinctPaths);
          if (storageError) {
            console.error('[cron/purge-trash] Storage delete error:', storageError.message);
          }
        } catch (storageError) {
          console.error('[cron/purge-trash] Failed to delete expired todo images from storage', storageError);
        }
      }

      const CHUNK_SIZE = 100;
      const todoIds = (expiredTodos as Array<{ id: string }>).map((item) => item.id).filter(Boolean);
      for (let i = 0; i < todoIds.length; i += CHUNK_SIZE) {
        const chunk = todoIds.slice(i, i + CHUNK_SIZE);
        const { count, error: deleteError } = await supabase
          .from('todos')
          .delete({ count: 'exact' })
          .in('id', chunk);

        if (deleteError) {
          console.error('[cron/purge-trash] Failed to delete batch of expired todos', deleteError);
        } else {
          purgedTodos += count ?? chunk.length;
        }
      }
    }

    // Query expired notes
    const { data: expiredNotes, error: notesError } = await supabase
      .from('notes')
      .select('id')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoff)
      .limit(500);

    if (notesError) {
      console.error('[cron/purge-trash] Failed to query expired notes', notesError);
      return NextResponse.json({ error: 'Failed to query expired notes' }, { status: 500 });
    }

    let purgedNotes = 0;
    if (expiredNotes && expiredNotes.length > 0) {
      const CHUNK_SIZE = 100;
      const noteIds = (expiredNotes as Array<{ id: string }>).map((item) => item.id).filter(Boolean);
      for (let i = 0; i < noteIds.length; i += CHUNK_SIZE) {
        const chunk = noteIds.slice(i, i + CHUNK_SIZE);
        const { count, error: deleteError } = await supabase
          .from('notes')
          .delete({ count: 'exact' })
          .in('id', chunk);

        if (deleteError) {
          console.error('[cron/purge-trash] Failed to delete batch of expired notes', deleteError);
        } else {
          purgedNotes += count ?? chunk.length;
        }
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      purgedTodos,
      purgedNotes,
      durationMs,
    });
  } catch (error) {
    console.error('[cron/purge-trash] Unhandled error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handlePurge(req);
}

export async function POST(req: Request) {
  return handlePurge(req);
}
