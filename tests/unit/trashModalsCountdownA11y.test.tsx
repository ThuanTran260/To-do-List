import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { TrashModal } from '@/components/todo/TrashModal';
import { NoteTrashModal } from '@/components/notes/NoteTrashModal';

// Inform React 19 that this is an act environment
// @ts-expect-error React act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock Query Client
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

// Mock Supabase Client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn(),
  }),
}));

// Mock Todo hooks
const mockUseTrashTodos = vi.fn();
vi.mock('@/hooks/useTodos', () => ({
  useTrashTodos: (isOpen: boolean) => mockUseTrashTodos(isOpen),
  useRestoreTodo: () => ({ mutate: vi.fn(), isPending: false }),
  usePermanentDeleteTodo: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Mock Note hooks
const mockUseTrashNotes = vi.fn();
vi.mock('@/hooks/useNotes', () => ({
  useTrashNotes: (isOpen: boolean) => mockUseTrashNotes(isOpen),
  useRestoreNote: () => ({ mutate: vi.fn(), isPending: false }),
  usePermanentDeleteNote: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock framer-motion to simplify DOM structure
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Trash Modals - Countdown and Accessibility (A11y)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('TrashModal (Todo Trash)', () => {
    it('calculates remaining days correctly and displays countdown badge with aria-label', async () => {
      const now = Date.now();
      const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyFiveDaysAgo = new Date(now - 35 * 24 * 60 * 60 * 1000).toISOString();

      mockUseTrashTodos.mockReturnValue({
        data: [
          {
            id: 'todo-1',
            title: 'Task deleted 10 days ago',
            priority: 'high',
            deleted_at: tenDaysAgo,
          },
          {
            id: 'todo-2',
            title: 'Task deleted 35 days ago (clamped)',
            priority: 'medium',
            deleted_at: thirtyFiveDaysAgo,
          },
        ],
        isLoading: false,
      });

      const root = createRoot(container);
      await act(async () => {
        root.render(<TrashModal isOpen={true} onClose={vi.fn()} />);
      });

      // Verify countdown badge for 10 days ago (20 days remaining)
      const badge1 = document.querySelector('[aria-label="Tự động xóa sau 20 ngày"]');
      expect(badge1).not.toBeNull();
      expect(badge1?.textContent).toContain('(Còn 20 ngày)');
      expect(badge1?.className).toContain('text-warning');

      // Verify countdown badge for 35 days ago (clamped to 1 day remaining)
      const badge2 = document.querySelector('[aria-label="Tự động xóa sau 1 ngày"]');
      expect(badge2).not.toBeNull();
      expect(badge2?.textContent).toContain('(Còn 1 ngày)');

      // Verify aria-live="polite" on the list container
      const liveList = document.querySelector('[aria-live="polite"]');
      expect(liveList).not.toBeNull();
      expect(liveList?.className).toContain('space-y-2');
    });

    it('falls back to 30 days if deleted_at is null or missing', async () => {
      mockUseTrashTodos.mockReturnValue({
        data: [
          {
            id: 'todo-3',
            title: 'Task without deleted_at',
            priority: 'low',
            deleted_at: null,
          },
        ],
        isLoading: false,
      });

      const root = createRoot(container);
      await act(async () => {
        root.render(<TrashModal isOpen={true} onClose={vi.fn()} />);
      });

      // deleted_at is null, so deleted date & countdown are not rendered
      const badge = document.querySelector('[aria-label*="Tự động xóa sau"]');
      expect(badge).toBeNull();
    });
  });

  describe('NoteTrashModal (Notes Trash)', () => {
    it('calculates remaining days correctly and displays countdown badge with aria-label', async () => {
      const now = Date.now();
      const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
      const noDateNote = {
        id: 'note-2',
        title: 'Note without deleted_at',
        content: '<p>Direct fallback check</p>',
        deleted_at: null,
      };

      mockUseTrashNotes.mockReturnValue({
        data: [
          {
            id: 'note-1',
            title: 'Test Note Title',
            content: '<p>Some note content here</p>',
            deleted_at: fiveDaysAgo,
          },
          noDateNote,
        ],
        isLoading: false,
      });

      const root = createRoot(container);
      await act(async () => {
        root.render(<NoteTrashModal isOpen={true} onClose={vi.fn()} />);
      });

      // Verify countdown badge for 5 days ago (25 days remaining)
      const badge = document.querySelector('[aria-label="Tự động xóa sau 25 ngày"]');
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toContain('(Còn 25 ngày)');
      expect(badge?.className).toContain('text-warning');

      // Verify note without deleted_at falls back to 30 days
      const fallbackBadge = document.querySelector('[aria-label="Tự động xóa sau 30 ngày"]');
      expect(fallbackBadge).not.toBeNull();
      expect(fallbackBadge?.textContent).toContain('(Còn 30 ngày)');

      // Verify aria-live="polite" on list container and footer summary
      const liveElements = document.querySelectorAll('[aria-live="polite"]');
      expect(liveElements.length).toBeGreaterThanOrEqual(2);

      // Verify list container has aria-live="polite"
      const listContainer = Array.from(liveElements).find((el) =>
        el.className.includes('overflow-y-auto')
      );
      expect(listContainer).toBeDefined();

      // Verify footer summary has aria-live="polite"
      const footerSummary = Array.from(liveElements).find((el) =>
        el.className.includes('border-t')
      );
      expect(footerSummary).toBeDefined();
      expect(footerSummary?.textContent).toContain('2 ghi chú trong thùng rác');
    });
  });
});
