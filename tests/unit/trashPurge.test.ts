import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purgeExpiredTrashTodos, fetchTrashTodos } from '@/lib/services/todoService';
import { purgeExpiredTrashNotes, fetchTrashNotes } from '@/lib/services/noteService';
import { deleteTaskImage } from '@/lib/storage';

vi.mock('@/lib/storage', () => ({
  deleteTaskImage: vi.fn().mockResolvedValue(undefined),
}));

describe('30-Day Auto-Purge & LCP-first filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('purgeExpiredTrashTodos', () => {
    it('returns 0 when fetch fails or returns no expired todos', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
        }),
      };

      const result = await purgeExpiredTrashTodos(mockSupabase as never, 'user-123');
      expect(result).toBe(0);
      expect(deleteTaskImage).not.toHaveBeenCalled();
    });

    it('returns 0 when expired todos array is empty', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };

      const result = await purgeExpiredTrashTodos(mockSupabase as never, 'user-123');
      expect(result).toBe(0);
      expect(deleteTaskImage).not.toHaveBeenCalled();
    });

    it('purges expired todos, deletes task images, and batch deletes in chunks of 100', async () => {
      // Create 150 items to verify chunking (CHUNK_SIZE = 100)
      const expiredItems = Array.from({ length: 150 }, (_, i) => ({
        id: `todo-${i + 1}`,
        image_path: i % 2 === 0 ? `path-${i + 1}.webp` : null,
        image_thumb_path: i % 3 === 0 ? `thumb-${i + 1}.webp` : null,
      }));

      const deleteCalls: Array<{ chunk: string[]; userId: string }> = [];

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: expiredItems, error: null }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockImplementation((col: string, chunk: string[]) => ({
            eq: vi.fn().mockImplementation((col2: string, uid: string) => {
              deleteCalls.push({ chunk, userId: uid });
              return Promise.resolve({ count: chunk.length, error: null });
            }),
          })),
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder),
      };

      const result = await purgeExpiredTrashTodos(mockSupabase as never, 'user-123');

      // Verify query constraints
      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(queryBuilder.select).toHaveBeenCalledWith('id, image_path, image_thumb_path');
      expect(queryBuilder.not).toHaveBeenCalledWith('deleted_at', 'is', null);
      expect(queryBuilder.lt).toHaveBeenCalledWith(
        'deleted_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      );
      expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(queryBuilder.limit).toHaveBeenCalledWith(500);

      // Verify images deletion
      expect(deleteTaskImage).toHaveBeenCalledTimes(1);
      const passedImagePaths = (deleteTaskImage as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(passedImagePaths).toContain('path-1.webp');
      expect(passedImagePaths).toContain('thumb-1.webp');

      // Verify chunking: 150 items should produce 2 delete calls (100 and 50)
      expect(deleteCalls.length).toBe(2);
      expect(deleteCalls[0].chunk.length).toBe(100);
      expect(deleteCalls[0].userId).toBe('user-123');
      expect(deleteCalls[1].chunk.length).toBe(50);
      expect(deleteCalls[1].userId).toBe('user-123');

      expect(result).toBe(150);
    });

    it('gracefully handles storage error without interrupting database row deletion', async () => {
      (deleteTaskImage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Storage failure'));

      const expiredItems = [
        { id: 'todo-err-1', image_path: 'path-fail.webp', image_thumb_path: null },
      ];

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: expiredItems, error: null }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
          }),
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder),
      };

      const result = await purgeExpiredTrashTodos(mockSupabase as never, 'user-123');
      expect(result).toBe(1);
    });
  });

  describe('fetchTrashTodos', () => {
    it('applies gte deleted_at cutoff for LCP and triggers background purge', async () => {
      const activeTrash = [
        { id: 'todo-recent-1', title: 'Recent deleted', deleted_at: new Date().toISOString() },
      ];

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: activeTrash, error: null }),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder),
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-456' } } }),
        },
      };

      const todos = await fetchTrashTodos(mockSupabase as never, 'user-456');

      expect(mockSupabase.from).toHaveBeenCalledWith('todos');
      expect(queryBuilder.select).toHaveBeenCalledWith('*');
      expect(queryBuilder.not).toHaveBeenCalledWith('deleted_at', 'is', null);
      expect(queryBuilder.gte).toHaveBeenCalledWith(
        'deleted_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      );
      expect(todos).toEqual(activeTrash);
    });

    it('falls back to auth.getUser() if userId is omitted', async () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const getUserMock = vi.fn().mockResolvedValue({ data: { user: { id: 'auth-user-999' } } });
      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder),
        auth: { getUser: getUserMock },
      };

      await fetchTrashTodos(mockSupabase as never);

      // Wait a tick for background async function to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(getUserMock).toHaveBeenCalled();
    });
  });

  describe('purgeExpiredTrashNotes', () => {
    it('returns 0 when fetch fails or notes are empty', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
        }),
      };

      const result = await purgeExpiredTrashNotes(mockSupabase as never, 'user-123');
      expect(result).toBe(0);
    });

    it('purges expired notes and batch deletes rows in chunks of 100', async () => {
      const expiredNotes = Array.from({ length: 125 }, (_, i) => ({
        id: `note-${i + 1}`,
      }));

      const deleteCalls: Array<{ chunk: string[]; userId: string }> = [];

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: expiredNotes, error: null }),
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockImplementation((col: string, chunk: string[]) => ({
            eq: vi.fn().mockImplementation((col2: string, uid: string) => {
              deleteCalls.push({ chunk, userId: uid });
              return Promise.resolve({ count: chunk.length, error: null });
            }),
          })),
        }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder),
      };

      const result = await purgeExpiredTrashNotes(mockSupabase as never, 'user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('notes');
      expect(queryBuilder.select).toHaveBeenCalledWith('id');
      expect(queryBuilder.not).toHaveBeenCalledWith('deleted_at', 'is', null);
      expect(queryBuilder.lt).toHaveBeenCalledWith(
        'deleted_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      );
      expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(queryBuilder.limit).toHaveBeenCalledWith(500);

      expect(deleteCalls.length).toBe(2);
      expect(deleteCalls[0].chunk.length).toBe(100);
      expect(deleteCalls[1].chunk.length).toBe(25);
      expect(result).toBe(125);
    });
  });

  describe('fetchTrashNotes', () => {
    it('applies gte deleted_at cutoff to primary query and maps notes', async () => {
      const activeTrashNotes = [
        {
          id: 'note-1',
          title: 'Recent note',
          deleted_at: new Date().toISOString(),
          note_tags: [{ tags: { id: 'tag-1', name: 'Work' } }],
        },
      ];

      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: activeTrashNotes, error: null }),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder),
      };

      const notes = await fetchTrashNotes(mockSupabase as never, 'user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('notes');
      expect(queryBuilder.select).toHaveBeenCalledWith('*, note_tags(tags(*))');
      expect(queryBuilder.gte).toHaveBeenCalledWith(
        'deleted_at',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
      );
      expect(notes[0].id).toBe('note-1');
      expect(notes[0].tags).toEqual([{ id: 'tag-1', name: 'Work' }]);
    });

    it('applies gte deleted_at cutoff to fallback query if relation query fails', async () => {
      const fallbackNotes = [
        {
          id: 'note-fallback',
          title: 'Fallback note',
          deleted_at: new Date().toISOString(),
        },
      ];

      let isFirst = true;
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => {
          if (isFirst) {
            isFirst = false;
            return Promise.resolve({ data: null, error: new Error('Relation missing') });
          }
          return Promise.resolve({ data: fallbackNotes, error: null });
        }),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder),
      };

      const notes = await fetchTrashNotes(mockSupabase as never, 'user-123');

      expect(queryBuilder.gte).toHaveBeenCalledTimes(2);
      expect(notes).toEqual(fallbackNotes);
    });

    it('falls back to auth.getUser() when userId is omitted', async () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        lt: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const getUserMock = vi.fn().mockResolvedValue({ data: { user: { id: 'auth-user-note' } } });
      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder),
        auth: { getUser: getUserMock },
      };

      await fetchTrashNotes(mockSupabase as never);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(getUserMock).toHaveBeenCalled();
    });
  });
});
