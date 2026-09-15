import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Modal } from '@/components/ui/Modal';
import { PriorityBadge } from '@/components/ui/Badge';
import { CustomPrioritySelect } from '@/components/ui/CustomPrioritySelect';
import { TodoItem } from '@/components/todo/TodoItem';
import { PerformanceToggle } from '@/components/layout/PerformanceToggle';
import { PerformanceProvider } from '@/providers/PerformanceProvider';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { TodoItemData } from '@/types/todo';

// Inform React 19 that this is an act environment
// @ts-expect-error React act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock hooks used in TodoItem, EditTodoModal, and ImageUpload
vi.mock('@/hooks/useTodos', () => ({
  useToggleTodo: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTodo: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTodo: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [] }),
  getReadableTextColor: () => '#ffffff',
}));

vi.mock('@/hooks/useSignedImageUrl', () => ({
  useSignedImageUrl: (url?: string | null) => ({ displayUrl: url || null }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Modal A11y and Firefox Layout Defenses', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Clean up any remaining portals in document.body
    document.body.innerHTML = '';
    document.body.style.overflow = 'unset';
    vi.restoreAllMocks();
  });

  it('renders with complete A11y attributes and Firefox viewport overflow defenses', async () => {
    const handleClose = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <Modal isOpen={true} onClose={handleClose} title="Cập nhật nhiệm vụ">
          <p>Nội dung chi tiết của modal</p>
        </Modal>
      );
    });

    // 1. Dialog container
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('modal-title');

    // 2. Centering and Max-Height defenses
    expect(dialog?.className).toContain('my-auto');
    expect(dialog?.className).toContain('max-h-[85vh]');
    expect(dialog?.className).toContain('supports-[height:100dvh]:max-h-[85dvh]');
    expect(dialog?.className).toContain('flex-col');

    // 3. Outer wrapper scrolling defense (prevents negative-Y clipping on small screens)
    const outerWrapper = dialog?.parentElement;
    expect(outerWrapper).not.toBeNull();
    expect(outerWrapper?.className).toContain('overflow-y-auto');

    // 4. Modal title ID linkage
    const titleElem = document.getElementById('modal-title');
    expect(titleElem).not.toBeNull();
    expect(titleElem?.textContent).toBe('Cập nhật nhiệm vụ');

    // 5. Close button A11y label
    const closeBtn = dialog?.querySelector('button[aria-label="Đóng"]');
    expect(closeBtn).not.toBeNull();

    // 6. Scrollable region with Firefox min-h-0 flex shrink defense & thin scrollbar
    const scrollRegion = dialog?.querySelector('[role="region"]');
    expect(scrollRegion).not.toBeNull();
    expect(scrollRegion?.getAttribute('tabIndex')).toBe('0');
    expect(scrollRegion?.getAttribute('aria-label')).toBe('Cập nhật nhiệm vụ');
    expect(scrollRegion?.className).toContain('min-h-0');
    expect(scrollRegion?.className).toContain('overflow-y-auto');
    expect(scrollRegion?.className).toContain('scrollbar-thin');
    expect(scrollRegion?.className).toContain('scrollbar-thumb-hairline');

    await act(async () => {
      root.unmount();
    });
  });

  it('triggers onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <Modal isOpen={true} onClose={handleClose} title="Thử nghiệm">
          <div>Content</div>
        </Modal>
      );
    });

    const closeBtn = document.querySelector('button[aria-label="Đóng"]') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    await act(async () => {
      closeBtn.click();
    });

    expect(handleClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  it('triggers onClose when backdrop overlay is clicked and backdrop has aria-hidden', async () => {
    const handleClose = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <Modal isOpen={true} onClose={handleClose} title="Backdrop Test">
          <div>Content</div>
        </Modal>
      );
    });

    const backdrop = document.querySelector('.bg-overlay') as HTMLDivElement;
    expect(backdrop).not.toBeNull();
    expect(backdrop?.getAttribute('aria-hidden')).toBe('true');

    await act(async () => {
      backdrop.click();
    });

    expect(handleClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  it('triggers onClose when Escape key is pressed', async () => {
    const handleClose = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <Modal isOpen={true} onClose={handleClose} title="Escape Test">
          <div>Content</div>
        </Modal>
      );
    });

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(handleClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });

  it('does not render when isOpen is false', async () => {
    const handleClose = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <Modal isOpen={false} onClose={handleClose} title="Closed Modal">
          <div>Hidden Content</div>
        </Modal>
      );
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await act(async () => {
      root.unmount();
    });
  });
});

describe('Semantic Subtle and Border Tokens Migration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    document.body.innerHTML = '';
  });

  it('PriorityBadge uses semantic tokens for high, medium, and low variants', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <div>
          <PriorityBadge priority="high" />
          <PriorityBadge priority="medium" />
          <PriorityBadge priority="low" />
        </div>
      );
    });

    const spans = container.querySelectorAll('span.inline-flex');
    expect(spans.length).toBe(3);

    // High: bg-danger-subtle text-danger border-danger-border
    const highBadge = spans[0];
    expect(highBadge.className).toContain('bg-danger-subtle');
    expect(highBadge.className).toContain('text-danger');
    expect(highBadge.className).toContain('border-danger-border');
    expect(highBadge.className).not.toContain('bg-danger/10');

    // Medium: bg-warning-subtle text-warning border-warning-border
    const mediumBadge = spans[1];
    expect(mediumBadge.className).toContain('bg-warning-subtle');
    expect(mediumBadge.className).toContain('text-warning');
    expect(mediumBadge.className).toContain('border-warning-border');
    expect(mediumBadge.className).not.toContain('bg-warning/10');

    // Low: bg-success-subtle text-success border-success-border
    const lowBadge = spans[2];
    expect(lowBadge.className).toContain('bg-success-subtle');
    expect(lowBadge.className).toContain('text-success');
    expect(lowBadge.className).toContain('border-success-border');
    expect(lowBadge.className).not.toContain('bg-success/10');

    await act(async () => {
      root.unmount();
    });
  });

  it('CustomPrioritySelect displays semantic tokens in selected option display', async () => {
    const root = createRoot(container);
    const handleChange = vi.fn();

    // 1. High
    await act(async () => {
      root.render(<CustomPrioritySelect value="high" onChange={handleChange} />);
    });

    let selectedBadge = container.querySelector('button span.px-2');
    expect(selectedBadge?.className).toContain('bg-danger-subtle');
    expect(selectedBadge?.className).toContain('border-danger-border');
    expect(selectedBadge?.className).toContain('text-danger');

    // 2. Medium
    await act(async () => {
      root.render(<CustomPrioritySelect value="medium" onChange={handleChange} />);
    });

    selectedBadge = container.querySelector('button span.px-2');
    expect(selectedBadge?.className).toContain('bg-warning-subtle');
    expect(selectedBadge?.className).toContain('border-warning-border');
    expect(selectedBadge?.className).toContain('text-warning');

    // 3. Low
    await act(async () => {
      root.render(<CustomPrioritySelect value="low" onChange={handleChange} />);
    });

    selectedBadge = container.querySelector('button span.px-2');
    expect(selectedBadge?.className).toContain('bg-success-subtle');
    expect(selectedBadge?.className).toContain('border-success-border');
    expect(selectedBadge?.className).toContain('text-success');

    await act(async () => {
      root.unmount();
    });
  });

  it('PerformanceToggle renders semantic subtle & border tokens in active lite mode', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PerformanceProvider defaultMode="lite">
          <PerformanceToggle />
        </PerformanceProvider>
      );
    });

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.className).toContain('bg-warning-subtle');
    expect(button?.className).toContain('text-warning');
    expect(button?.className).toContain('border-warning-border');
    expect(button?.className).toContain('hover:bg-warning/20');

    await act(async () => {
      root.unmount();
    });
  });

  it('ImageUpload preview uses reduced max-height constraints and semantic token error banner', async () => {
    const root = createRoot(container);

    // 1. Render with existing image: verify max-h-40 sm:max-h-44
    await act(async () => {
      root.render(
        <ImageUpload
          value="https://example.com/test.png"
          onChangeFile={vi.fn()}
        />
      );
    });

    const previewContainer = container.querySelector('div.aspect-video');
    expect(previewContainer).not.toBeNull();
    expect(previewContainer?.className).toContain('max-h-40');
    expect(previewContainer?.className).toContain('sm:max-h-44');

    // 2. Render without image and upload an invalid file: verify error banner
    await act(async () => {
      root.render(
        <ImageUpload
          value={null}
          onChangeFile={vi.fn()}
        />
      );
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const invalidFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      configurable: true,
    });

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const errorBanner = container.querySelector('div.bg-danger-subtle');
    expect(errorBanner).not.toBeNull();
    expect(errorBanner?.className).toContain('border-danger-border');
    expect(errorBanner?.className).toContain('text-danger');
    expect(errorBanner?.textContent).toContain('Chỉ chấp nhận định dạng ảnh JPG, PNG hoặc WebP.');

    await act(async () => {
      root.unmount();
    });
  });
});

describe('TodoItem Clean Overdue Indicator & Pomodoro Badge', () => {
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
  });

  it('renders overdue task with left border accent, hover defense, clean surface, and red clock', async () => {
    const root = createRoot(container);

    // Overdue date: 5 days in the past
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const overdueTodo: TodoItemData = {
      id: 'task-overdue-1',
      user_id: 'user-1',
      title: 'Báo cáo trễ hạn',
      description: 'Cần nộp gấp',
      is_completed: false,
      priority: 'high',
      due_date: pastDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      pomodoro_count: 3,
    };

    await act(async () => {
      root.render(<TodoItem item={overdueTodo} />);
    });

    const card = container.querySelector('div.group.relative');
    expect(card).not.toBeNull();

    // 1. Clean surface without full-card bg-danger tint
    expect(card?.className).toContain('bg-surface-1');
    expect(card?.className).not.toContain('bg-danger/8');

    // 2. High contrast left border accent
    expect(card?.className).toContain('border-l-4');
    expect(card?.className).toContain('border-l-danger');

    // 3. Hover defense preserving left danger border
    expect(card?.className).toContain('hover:border-hairline-strong');
    expect(card?.className).toContain('hover:border-l-danger');

    // 4. Overdue clock icon has explicit text-danger
    const clockIcon = container.querySelector('svg.text-danger');
    expect(clockIcon).not.toBeNull();

    // 5. Pomodoro badge and High Priority badge both use semantic tokens
    const dangerBadges = container.querySelectorAll('span.bg-danger-subtle');
    expect(dangerBadges.length).toBe(2);

    const priorityBadge = dangerBadges[0];
    expect(priorityBadge.textContent).toContain('Cao');

    const pomodoroBadge = dangerBadges[1];
    expect(pomodoroBadge).not.toBeNull();
    expect(pomodoroBadge.className).toContain('text-danger');
    expect(pomodoroBadge.className).toContain('border-danger-border');
    expect(pomodoroBadge.textContent).toContain('🍅 3');

    await act(async () => {
      root.unmount();
    });
  });

  it('does not render red left accent border for completed or non-overdue tasks', async () => {
    const root = createRoot(container);

    // Future date: 5 days in the future
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const normalTodo: TodoItemData = {
      id: 'task-normal-1',
      user_id: 'user-1',
      title: 'Nhiệm vụ bình thường',
      description: null,
      is_completed: false,
      priority: 'medium',
      due_date: futureDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    const completedTodo: TodoItemData = {
      id: 'task-completed-1',
      user_id: 'user-1',
      title: 'Nhiệm vụ đã xong',
      description: null,
      is_completed: true,
      priority: 'high',
      due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    await act(async () => {
      root.render(
        <div>
          <TodoItem item={normalTodo} />
          <TodoItem item={completedTodo} />
        </div>
      );
    });

    const cards = container.querySelectorAll('div.group.relative');
    expect(cards.length).toBe(2);

    // Normal task: clean surface, no left border accent
    expect(cards[0].className).toContain('bg-surface-1');
    expect(cards[0].className).not.toContain('border-l-4');
    expect(cards[0].className).not.toContain('border-l-danger');

    // Completed task: surface-2/60, no left border accent
    expect(cards[1].className).toContain('bg-surface-2/60');
    expect(cards[1].className).not.toContain('border-l-4');
    expect(cards[1].className).not.toContain('border-l-danger');

    await act(async () => {
      root.unmount();
    });
  });
});
