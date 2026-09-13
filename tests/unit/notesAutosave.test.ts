import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  noteBaseSchema,
  noteCreateSchema,
  noteUpdateSchema,
  type NoteInput,
  type NoteUpdate,
} from '@/lib/validations/note';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rateLimit';
import { csrfFetch, refreshCsrfToken } from '@/lib/security/csrfClient';

describe('P1 RC1: noteUpdateSchema Partiality & Data Preservation', () => {
  it('exports noteBaseSchema, noteCreateSchema, noteUpdateSchema, and refreshCsrfToken', () => {
    expect(noteBaseSchema).toBeDefined();
    expect(noteCreateSchema).toBeDefined();
    expect(noteUpdateSchema).toBeDefined();
    expect(refreshCsrfToken).toBeDefined();
  });

  it('partial update with only color does NOT inject default empty content or false flags', () => {
    const parsed = noteUpdateSchema.safeParse({ color: 'yellow' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ color: 'yellow' });
      expect(parsed.data).not.toHaveProperty('content');
      expect(parsed.data).not.toHaveProperty('title');
      expect(parsed.data).not.toHaveProperty('is_pinned');
      expect(parsed.data).not.toHaveProperty('is_archived');
    }
  });

  it('partial update with only title does NOT inject empty content', () => {
    const parsed = noteUpdateSchema.safeParse({ title: 'Updated Title' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ title: 'Updated Title' });
      expect(parsed.data).not.toHaveProperty('content');
    }
  });

  it('noteCreateSchema maintains default values and supports optional client-generated id', () => {
    const testId = '11111111-1111-4111-8111-111111111111';
    const parsed = noteCreateSchema.safeParse({
      id: testId,
      title: 'New Note',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe(testId);
      expect(parsed.data.title).toBe('New Note');
      expect(parsed.data.content).toBe('');
      expect(parsed.data.color).toBe('default');
      expect(parsed.data.is_pinned).toBe(false);
      expect(parsed.data.is_archived).toBe(false);
    }
  });

  it('verifies type compatibility for NoteInput and NoteUpdate contracts', () => {
    const sampleInput: NoteInput = {
      title: 'T',
      content: 'C',
    };
    const sampleUpdate: NoteUpdate = {
      color: 'blue',
      deleted_at: null,
    };
    expect(noteCreateSchema.safeParse(sampleInput).success).toBe(true);
    expect(noteUpdateSchema.safeParse(sampleUpdate).success).toBe(true);
  });
});

describe('P0 RC4: Rate Limit Allocation (120 for write vs 60 for sync)', () => {
  beforeEach(() => {
    resetRateLimit('test:notes:write');
    resetRateLimit('test:notes:sync');
  });

  it('notes:write quota permits up to 120 requests per minute', () => {
    for (let i = 0; i < 120; i++) {
      expect(checkRateLimit('test:notes:write', 120, 60000)).toBe(true);
    }
    expect(checkRateLimit('test:notes:write', 120, 60000)).toBe(false);
  });

  it('notes:sync quota permits up to 60 requests per minute', () => {
    for (let i = 0; i < 60; i++) {
      expect(checkRateLimit('test:notes:sync', 60, 60000)).toBe(true);
    }
    expect(checkRateLimit('test:notes:sync', 60, 60000)).toBe(false);
  });
});

describe('P0 RC3: CSRF Recovery & Auto-Retry', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('refreshes token via /api/csrf-token and retries once on 403 Forbidden', async () => {
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(async (url: string | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/csrf-token')) {
        return new Response(JSON.stringify({ csrfToken: 'refreshed-token-999' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      callCount++;
      if (callCount === 1) {
        // First request fails with 403 CSRF error
        return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), { status: 403 });
      }
      // Second request succeeds after token refresh
      const headerToken = (init?.headers as Headers)?.get('x-csrf-token');
      expect(headerToken).toBe('refreshed-token-999');
      return new Response(JSON.stringify({ note: { id: 'note-123' } }), { status: 200 });
    });

    global.fetch = fetchMock;

    const res = await csrfFetch('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    expect(res.status).toBe(200);
    expect(callCount).toBe(2);
  });
});

describe('P1 RC2 & RC5: Single-Tab Promise Join & Keystroke Preservation Simulation', () => {
  it('prevents duplicate create mutations when two save cycles overlap', async () => {
    let createCallCount = 0;
    let updateCallCount = 0;

    let resolveCreate!: (value: { id: string; title: string; updated_at: string }) => void;
    const slowCreatePromise = new Promise<{ id: string; title: string; updated_at: string }>((resolve) => {
      resolveCreate = resolve;
    });

    const mockCreateMutation = {
      mutateAsync: vi.fn().mockImplementation(async () => {
        createCallCount++;
        return slowCreatePromise;
      }),
    };

    const mockUpdateMutation = {
      mutateAsync: vi.fn().mockImplementation(async (payload: { id: string; title: string }) => {
        updateCallCount++;
        return { id: payload.id, title: payload.title, updated_at: new Date().toISOString() };
      }),
    };

    let inFlightCreatePromise: Promise<{ id: string; title: string; updated_at: string }> | null = null;
    let activeNoteId: string | null = null;
    let dirtyAt = 0;
    let isDirty = false;

    async function executeSaveSimulation(title: string) {
      if (!isDirty) return;
      const saveStartTime = Date.now();

      if (!activeNoteId) {
        if (inFlightCreatePromise) {
          const created = await inFlightCreatePromise;
          activeNoteId = created.id;
        } else {
          const createPromise = mockCreateMutation.mutateAsync({ title });
          inFlightCreatePromise = createPromise;
          try {
            const created = await createPromise;
            activeNoteId = created.id;
          } finally {
            inFlightCreatePromise = null;
          }
        }
      }

      if (activeNoteId && dirtyAt > saveStartTime) {
        await mockUpdateMutation.mutateAsync({ id: activeNoteId, title });
      }

      if (dirtyAt <= saveStartTime) {
        isDirty = false;
      }
    }

    let currentTime = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // Timeline:
    // t = 1000: User types "A" -> dirtyAt = 1000
    currentTime = 1000;
    dirtyAt = 1000;
    isDirty = true;
    const save1 = executeSaveSimulation('A'); // saveStartTime = 1000

    // t = 1200: User types "AB" while save 1 is in-flight -> dirtyAt = 1200
    currentTime = 1200;
    dirtyAt = 1200;
    isDirty = true;

    // t = 1500: save 1 resolves from server
    currentTime = 1500;
    resolveCreate({ id: 'uuid-note-1', title: 'A', updated_at: new Date().toISOString() });

    await save1;

    // Assert: Exactly 1 create call was made
    expect(createCallCount).toBe(1);
    expect(activeNoteId).toBe('uuid-note-1');

    // Because dirtyAt (1200) > saveStartTime (1000), isDirty remains true!
    expect(isDirty).toBe(true);

    // t = 1800: Next debounce cycle fires executeSave with "AB"
    currentTime = 1800;
    await executeSaveSimulation('AB');

    // Assert: Update mutation was triggered for "AB"
    expect(updateCallCount).toBe(1);
    // Assert: All keystrokes saved, isDirty is now false
    expect(isDirty).toBe(false);
  });
});

