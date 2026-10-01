import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '@/app/api/cron/purge-trash/route';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('Cron /api/cron/purge-trash route handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Authentication and Configuration Guards', () => {
    it('returns 401 when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer secret123' },
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({ error: 'Unauthorized' });
      expect(consoleSpy).toHaveBeenCalledWith('[cron/purge-trash] CRON_SECRET not configured');
      consoleSpy.mockRestore();
    });

    it('returns 401 when Authorization header is missing', async () => {
      process.env.CRON_SECRET = 'expected-secret';
      const req = new Request('http://localhost/api/cron/purge-trash');

      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when Authorization header token does not match (different length)', async () => {
      process.env.CRON_SECRET = 'expected-secret';
      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer wrong-secret' },
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when Authorization header token does not match (same length)', async () => {
      process.env.CRON_SECRET = 'expected-secret';
      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer expacted-secret' },
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 on POST request when unauthorized', async () => {
      process.env.CRON_SECRET = 'expected-secret';
      const req = new Request('http://localhost/api/cron/purge-trash', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong-secret' },
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      process.env.CRON_SECRET = 'expected-secret';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-supabase.supabase.co';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer expected-secret' },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json).toEqual({ error: 'Supabase service role not configured' });
    });

    it('returns 500 when NEXT_PUBLIC_SUPABASE_URL contains placeholder', async () => {
      process.env.CRON_SECRET = 'expected-secret';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key';

      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer expected-secret' },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json).toEqual({ error: 'Supabase service role not configured' });
    });
  });

  describe('Purge Execution', () => {
    beforeEach(() => {
      process.env.CRON_SECRET = 'cron-secret-123';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-456';
    });

    it('purges expired todos & notes, cleans up images via service role storage, and batches DB deletes', async () => {
      const expiredTodos = Array.from({ length: 150 }, (_, i) => ({
        id: `todo-${i + 1}`,
        image_path: i % 2 === 0 ? `path-${i + 1}.webp` : null,
        image_thumb_path: i % 3 === 0 ? `thumb-${i + 1}.webp` : null,
      }));

      const expiredNotes = Array.from({ length: 120 }, (_, i) => ({
        id: `note-${i + 1}`,
      }));

      const todoDeleteChunks: string[][] = [];
      const noteDeleteChunks: string[][] = [];

      const todosQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: expiredTodos, error: null }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockImplementation((_col: string, chunk: string[]) => {
            todoDeleteChunks.push(chunk);
            return Promise.resolve({ count: chunk.length, error: null });
          }),
        }),
      };

      const notesQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: expiredNotes, error: null }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockImplementation((_col: string, chunk: string[]) => {
            noteDeleteChunks.push(chunk);
            return Promise.resolve({ count: chunk.length, error: null });
          }),
        }),
      };

      const mockStorageRemove = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: mockStorageRemove,
      });

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'todos') return todosQuery;
          if (table === 'notes') return notesQuery;
          throw new Error(`Unexpected table ${table}`);
        }),
        storage: {
          from: mockStorageFrom,
        },
      };

      (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer cron-secret-123' },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.purgedTodos).toBe(150);
      expect(json.purgedNotes).toBe(120);
      expect(typeof json.durationMs).toBe('number');

      // Verify createClient called with service role config
      expect(createClient).toHaveBeenCalledWith(
        'https://project.supabase.co',
        'service-role-key-456',
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      // Verify todos query filters
      expect(todosQuery.select).toHaveBeenCalledWith('id, image_path, image_thumb_path');
      expect(todosQuery.not).toHaveBeenCalledWith('deleted_at', 'is', null);
      expect(todosQuery.lt).toHaveBeenCalledWith(
        'deleted_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      );
      expect(todosQuery.limit).toHaveBeenCalledWith(500);

      // Verify storage image cleanup called on service-role supabase client
      expect(mockStorageFrom).toHaveBeenCalledWith('task-attachments');
      expect(mockStorageRemove).toHaveBeenCalledTimes(1);
      const passedImagePaths = mockStorageRemove.mock.calls[0][0];
      expect(passedImagePaths).toContain('path-1.webp');
      expect(passedImagePaths).toContain('thumb-1.webp');
      expect(new Set(passedImagePaths).size).toBe(passedImagePaths.length);

      // Verify chunking for todos (150 -> 100 + 50)
      expect(todoDeleteChunks.length).toBe(2);
      expect(todoDeleteChunks[0].length).toBe(100);
      expect(todoDeleteChunks[1].length).toBe(50);

      // Verify notes query filters
      expect(notesQuery.select).toHaveBeenCalledWith('id');
      expect(notesQuery.not).toHaveBeenCalledWith('deleted_at', 'is', null);
      expect(notesQuery.lt).toHaveBeenCalledWith(
        'deleted_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      );
      expect(notesQuery.limit).toHaveBeenCalledWith(500);

      // Verify chunking for notes (120 -> 100 + 20)
      expect(noteDeleteChunks.length).toBe(2);
      expect(noteDeleteChunks[0].length).toBe(100);
      expect(noteDeleteChunks[1].length).toBe(20);
    });

    it('works identically via POST request', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      const req = new Request('http://localhost/api/cron/purge-trash', {
        method: 'POST',
        headers: { authorization: 'Bearer cron-secret-123' },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.purgedTodos).toBe(0);
      expect(json.purgedNotes).toBe(0);
    });

    it('gracefully handles storage image errors without failing DB deletion', async () => {
      const mockStorageRemove = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage bucket unavailable' },
      });
      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: mockStorageRemove,
      });

      const expiredTodos = [
        { id: 'todo-1', image_path: 'failed-img.webp', image_thumb_path: null },
      ];

      const todosQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: expiredTodos, error: null }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      };

      const notesQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockSupabase = {
        from: vi.fn().mockImplementation((t) => (t === 'todos' ? todosQuery : notesQuery)),
        storage: {
          from: mockStorageFrom,
        },
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer cron-secret-123' },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.purgedTodos).toBe(1);
      expect(mockStorageFrom).toHaveBeenCalledWith('task-attachments');
      expect(mockStorageRemove).toHaveBeenCalledWith(['failed-img.webp']);
    });

    it('gracefully handles thrown storage exceptions without failing DB deletion', async () => {
      const mockStorageRemove = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockStorageFrom = vi.fn().mockReturnValue({
        remove: mockStorageRemove,
      });

      const expiredTodos = [
        { id: 'todo-1', image_path: 'failed-img.webp', image_thumb_path: null },
      ];

      const todosQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: expiredTodos, error: null }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      };

      const notesQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockSupabase = {
        from: vi.fn().mockImplementation((t) => (t === 'todos' ? todosQuery : notesQuery)),
        storage: {
          from: mockStorageFrom,
        },
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer cron-secret-123' },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.purgedTodos).toBe(1);
    });

    it('returns 500 when todos query fails with a database error', async () => {
      const todosQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database connection failed' } }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(todosQuery),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer cron-secret-123' },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json).toEqual({ error: 'Failed to query expired todos' });
    });

    it('returns 500 when notes query fails with a database error', async () => {
      const todosQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const notesQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Notes query failed' } }),
      };

      const mockSupabase = {
        from: vi.fn().mockImplementation((t) => (t === 'todos' ? todosQuery : notesQuery)),
      };
      (createClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);

      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer cron-secret-123' },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json).toEqual({ error: 'Failed to query expired notes' });
    });

    it('returns 500 when an unhandled exception occurs in handler logic', async () => {
      (createClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Fatal client creation failure');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const req = new Request('http://localhost/api/cron/purge-trash', {
        headers: { authorization: 'Bearer cron-secret-123' },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json).toEqual({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalledWith(
        '[cron/purge-trash] Unhandled error',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
