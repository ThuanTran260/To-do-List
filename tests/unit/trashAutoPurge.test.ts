import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purgeExpiredTrashTodos, fetchTrashTodos } from '@/lib/services/todoService';
import { purgeExpiredTrashNotes, fetchTrashNotes } from '@/lib/services/noteService';
import { deleteTaskImage } from '@/lib/storage';
import { GET as cronHandler } from '@/app/api/cron/purge-trash/route';
import { createClient } from '@supabase/supabase-js';

vi.mock('@/lib/storage', () => ({
  deleteTaskImage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('Integration Test Suite: 30-Day Trash Auto-Purge Mechanism', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Scenario 1: 30-day cutoff filter
  describe('Scenario 1: 30-Day Cutoff Filter in fetchTrashTodos and fetchTrashNotes', () => {
    it('fetchTrashTodos applies .gte("deleted_at", cutoff) to exclude items deleted > 30 days ago', async () => {
      const activeTrashItems = [
        { id: 'todo-recent-1', title: 'Deleted 5 days ago', deleted_at: new Date(Date.now() - 5 * 86400000).toISOString() },
        { id: 'todo-recent-2', title: 'Deleted 20 days ago', deleted_at: new Date(Date.now() - 20 * 86400000).toISOString() },
      ];

      const gteSpy = vi.fn().mockReturnThis();
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: gteSpy,
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        order: vi.fn().mockResolvedValue({ data: activeTrashItems, error: null }),
      };
      const mockSupabase = {
        from: vi.fn().mockReturnValue(mockQuery),
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
        },
      };

      const result = await fetchTrashTodos(mockSupabase as never, 'test-user');
      expect(result).toHaveLength(2);
      expect(gteSpy).toHaveBeenCalledWith(
        'deleted_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      );
    });

    it('fetchTrashNotes applies .gte("deleted_at", cutoff) to exclude notes deleted > 30 days ago', async () => {
      const activeTrashNotes = [
        { id: 'note-recent-1', title: 'Note deleted 10 days ago', deleted_at: new Date(Date.now() - 10 * 86400000).toISOString(), note_tags: [] },
      ];

      const gteSpy = vi.fn().mockReturnThis();
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: gteSpy,
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        order: vi.fn().mockResolvedValue({ data: activeTrashNotes, error: null }),
      };
      const mockSupabase = {
        from: vi.fn().mockReturnValue(mockQuery),
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
        },
      };

      const result = await fetchTrashNotes(mockSupabase as never, 'test-user');
      expect(result).toHaveLength(1);
      expect(gteSpy).toHaveBeenCalledWith(
        'deleted_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      );
    });
  });

  // Scenario 2: Fire-and-forget purge & storage cleanup
  describe('Scenario 2: Fire-and-Forget Purge & Storage Image Cleanup', () => {
    it('purges tasks older than 30 days and removes associated images from storage', async () => {
      const expiredTodos = [
        { id: 'todo-old-1', image_path: 'user-1/img1.webp', image_thumb_path: 'user-1/thumb1.webp' },
        { id: 'todo-old-2', image_path: 'user-1/img2.webp', image_thumb_path: null },
      ];

      const deleteMock = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
        }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: expiredTodos, error: null }),
          delete: deleteMock,
        }),
      };

      const count = await purgeExpiredTrashTodos(mockSupabase as never, 'user-1');
      expect(count).toBe(2);
      expect(deleteTaskImage).toHaveBeenCalledWith(
        'user-1/img1.webp',
        'user-1/thumb1.webp',
        'user-1/img2.webp'
      );
    });
  });

  // Scenario 3: RLS Scoping & User Isolation
  describe('Scenario 3: RLS Scoping & User Isolation (User A vs User B)', () => {
    it('User A purge only targets records where user_id == userA.id', async () => {
      const eqCalls: string[] = [];

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col: string, val: string) => {
          eqCalls.push(`${col}=${val}`);
          return queryBuilder;
        }),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 'task-user-a', image_path: null, image_thumb_path: null }],
          error: null,
        }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              eqCalls.push(`delete_${col}=${val}`);
              return Promise.resolve({ count: 1, error: null });
            }),
          }),
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder),
      };

      await purgeExpiredTrashTodos(mockSupabase as never, 'user-A-uuid');

      // Verify that both SELECT and DELETE strictly scope by user_id = 'user-A-uuid'
      expect(eqCalls).toContain('user_id=user-A-uuid');
      expect(eqCalls).toContain('delete_user_id=user-A-uuid');
      expect(eqCalls.some((c) => c.includes('user-B-uuid'))).toBe(false);
    });
  });

  // Scenario 4: Batch Chunking
  describe('Scenario 4: Batch Chunking (CHUNK_SIZE = 100)', () => {
    it('splits large item lists into batches of 100 for PostgREST .in("id", chunk)', async () => {
      const totalItems = 235;
      const expiredItems = Array.from({ length: totalItems }, (_, i) => ({
        id: `note-${i + 1}`,
      }));

      const chunkBatches: string[][] = [];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: expiredItems, error: null }),
          delete: vi.fn().mockReturnValue({
            in: vi.fn().mockImplementation((_col: string, chunk: string[]) => {
              chunkBatches.push(chunk);
              return {
                eq: vi.fn().mockResolvedValue({ count: chunk.length, error: null }),
              };
            }),
          }),
        }),
      };

      const purgedCount = await purgeExpiredTrashNotes(mockSupabase as never, 'user-batch-test');
      expect(purgedCount).toBe(235);
      expect(chunkBatches).toHaveLength(3);
      expect(chunkBatches[0]).toHaveLength(100);
      expect(chunkBatches[1]).toHaveLength(100);
      expect(chunkBatches[2]).toHaveLength(35);
    });
  });

  // Scenario 5: Cron Route Authorization & Execution
  describe('Scenario 5: Cron Route Authorization & Security', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://valid-supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key';
    });

    it('returns 401 fail-closed when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;
      const req = new Request('http://localhost:3000/api/cron/purge-trash', {
        headers: { Authorization: 'Bearer some-secret' },
      });

      const res = await cronHandler(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('returns 401 when Authorization header is invalid or missing', async () => {
      process.env.CRON_SECRET = 'correct-secret-12345';
      const req = new Request('http://localhost:3000/api/cron/purge-trash', {
        headers: { Authorization: 'Bearer wrong-secret' },
      });

      const res = await cronHandler(req);
      expect(res.status).toBe(401);
    });

    it('returns 200 OK with execution summary when Authorization header is valid', async () => {
      process.env.CRON_SECRET = 'super-secret-key-32-chars-long!';

      const removeStorageSpy = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockClient = {
        storage: {
          from: vi.fn().mockReturnValue({
            remove: removeStorageSpy,
          }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'todos') {
            return {
              select: vi.fn().mockReturnThis(),
              not: vi.fn().mockReturnThis(),
              lt: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'cron-todo-1', image_path: 'path1.png', image_thumb_path: null }],
                error: null,
              }),
              delete: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 1, error: null }),
              }),
            };
          }
          if (table === 'notes') {
            return {
              select: vi.fn().mockReturnThis(),
              not: vi.fn().mockReturnThis(),
              lt: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'cron-note-1' }],
                error: null,
              }),
              delete: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 1, error: null }),
              }),
            };
          }
          return {};
        }),
      };

      (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

      const req = new Request('http://localhost:3000/api/cron/purge-trash', {
        headers: { Authorization: 'Bearer super-secret-key-32-chars-long!' },
      });

      const res = await cronHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.purgedTodos).toBe(1);
      expect(json.purgedNotes).toBe(1);
      expect(typeof json.durationMs).toBe('number');
      expect(removeStorageSpy).toHaveBeenCalledWith(['path1.png']);
    });
  });
});
