import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useWheelMonthScroll } from '@/hooks/useWheelYearScroll';
import { CalendarPopover } from '@/components/widget/CalendarPopover';
import { DropdownManagerProvider, useDropdownManager } from '@/hooks/useDropdownManager';

// Inform React 19 that this is an act environment
// @ts-expect-error React act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock useTodos
vi.mock('@/hooks/useTodos', () => ({
  useTodos: () => ({
    data: {
      todos: [
        { id: '1', title: 'Task 1', due_date: new Date().toISOString(), priority: 'high' },
        { id: '2', title: 'Task 2', due_date: new Date().toISOString(), priority: 'medium' },
      ],
    },
  }),
  useCreateTodo: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Test harness for testing the hook in isolation
function WheelTestComponent({
  onMonthChange,
  cooldownMs = 180,
  threshold = 40,
}: {
  onMonthChange: (delta: number) => void;
  cooldownMs?: number;
  threshold?: number;
}) {
  const { containerRef, handleWheel } = useWheelMonthScroll({
    onMonthChange,
    cooldownMs,
    threshold,
  });

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      data-testid="wheel-target"
      style={{ width: 300, height: 300, overflow: 'hidden' }}
    >
      <div data-testid="inner-content">Calendar Content</div>
    </div>
  );
}

describe('Calendar Scroll Isolation & useWheelMonthScroll Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    window.scrollY = 0;
    document.documentElement.scrollTop = 0;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.clearAllMocks();
  });

  it('attaches native non-passive wheel listener, isolates page scroll, and calls preventDefault/stopPropagation', async () => {
    const onMonthChange = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(<WheelTestComponent onMonthChange={onMonthChange} />);
    });

    const target = container.querySelector('[data-testid="wheel-target"]') as HTMLDivElement;
    expect(target).not.toBeNull();

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 50,
      bubbles: true,
      cancelable: true,
    });

    const stopPropagationSpy = vi.spyOn(wheelEvent, 'stopPropagation');

    target.dispatchEvent(wheelEvent);

    // Verifies preventDefault was invoked on native wheel event
    expect(wheelEvent.defaultPrevented).toBe(true);
    expect(stopPropagationSpy).toHaveBeenCalled();

    // Verifies page body/window scroll remained completely locked at 0
    expect(window.scrollY).toBe(0);
    expect(document.documentElement.scrollTop).toBe(0);

    // 50px exceeds threshold 40px -> onMonthChange(1) called
    expect(onMonthChange).toHaveBeenCalledWith(1);

    await act(async () => {
      root.unmount();
    });
  });

  it('normalizes deltaMode: pixel (mode 0), line (mode 1 x33), and page (mode 2 x100)', async () => {
    const onMonthChange = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(<WheelTestComponent onMonthChange={onMonthChange} cooldownMs={0} />);
    });

    const target = container.querySelector('[data-testid="wheel-target"]') as HTMLDivElement;

    // Line mode: deltaMode = 1. deltaY = 2 lines * 33 = 66px >= 40px -> 1 month
    const lineEvent = new WheelEvent('wheel', {
      deltaY: 2,
      deltaMode: 1,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(lineEvent);
    expect(onMonthChange).toHaveBeenCalledWith(1);

    // Page mode: deltaMode = 2. deltaY = -1 page * 100 = -100px <= -40px -> -1 month
    const pageEvent = new WheelEvent('wheel', {
      deltaY: -1,
      deltaMode: 2,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(pageEvent);
    expect(onMonthChange).toHaveBeenCalledWith(-1);

    await act(async () => {
      root.unmount();
    });
  });

  it('enforces 180ms cooldown lock against trackpad inertia / momentum leak', async () => {
    const onMonthChange = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(<WheelTestComponent onMonthChange={onMonthChange} cooldownMs={180} />);
    });

    const target = container.querySelector('[data-testid="wheel-target"]') as HTMLDivElement;

    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = () => mockTime;

    try {
      // First flick: deltaY = 50px at t = 1000ms -> triggers month change (+1)
      target.dispatchEvent(new WheelEvent('wheel', { deltaY: 50, bubbles: true, cancelable: true }));
      expect(onMonthChange).toHaveBeenCalledTimes(1);
      expect(onMonthChange).toHaveBeenLastCalledWith(1);

      // Trackpad momentum event arrives 50ms later (t = 1050ms) with deltaY = 60px
      // Must be absorbed by cooldown lock without triggering a second month change
      mockTime = 1050;
      target.dispatchEvent(new WheelEvent('wheel', { deltaY: 60, bubbles: true, cancelable: true }));
      expect(onMonthChange).toHaveBeenCalledTimes(1);

      // Another momentum event arrives at t = 1150ms (150ms after initial)
      mockTime = 1150;
      target.dispatchEvent(new WheelEvent('wheel', { deltaY: 45, bubbles: true, cancelable: true }));
      expect(onMonthChange).toHaveBeenCalledTimes(1);

      // After cooldown expires at t = 1200ms (> 180ms)
      mockTime = 1200;
      target.dispatchEvent(new WheelEvent('wheel', { deltaY: 50, bubbles: true, cancelable: true }));
      expect(onMonthChange).toHaveBeenCalledTimes(2);
      expect(onMonthChange).toHaveBeenLastCalledWith(1);
    } finally {
      Date.now = originalNow;
    }

    await act(async () => {
      root.unmount();
    });
  });

  it('removes native wheel listener on unmount to prevent memory leaks', async () => {
    const onMonthChange = vi.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(<WheelTestComponent onMonthChange={onMonthChange} />);
    });

    const target = container.querySelector('[data-testid="wheel-target"]') as HTMLDivElement;
    expect(target).not.toBeNull();

    await act(async () => {
      root.unmount();
    });

    // Dispatching event on unmounted target element should not call onMonthChange
    target.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
    expect(onMonthChange).not.toHaveBeenCalled();
  });

  it('preserves native scrolling for internal overflowing child elements without triggering month change or blocking scroll', async () => {
    const onMonthChange = vi.fn();

    function NestedScrollTestComponent() {
      const { containerRef } = useWheelMonthScroll({
        onMonthChange,
        cooldownMs: 0,
        threshold: 40,
      });

      return (
        <div ref={containerRef} data-testid="panel-container">
          <div
            data-testid="scrollable-inner"
            className="overflow-y-auto"
            style={{ height: 100 }}
          >
            <div data-testid="scrollable-item" style={{ height: 300 }}>
              Long Content
            </div>
          </div>
        </div>
      );
    }

    const root = createRoot(container);
    await act(async () => {
      root.render(<NestedScrollTestComponent />);
    });

    const scrollableInner = container.querySelector('[data-testid="scrollable-inner"]') as HTMLElement;
    const scrollableItem = container.querySelector('[data-testid="scrollable-item"]') as HTMLElement;

    // Mock scrollHeight > clientHeight to represent overflowing internal content
    Object.defineProperty(scrollableInner, 'scrollHeight', { value: 300, configurable: true });
    Object.defineProperty(scrollableInner, 'clientHeight', { value: 100, configurable: true });

    const innerWheelEvent = new WheelEvent('wheel', {
      deltaY: 50,
      bubbles: true,
      cancelable: true,
    });

    scrollableItem.dispatchEvent(innerWheelEvent);

    // Internal scroll MUST NOT be preventDefault'd (so user can scroll internal list)
    expect(innerWheelEvent.defaultPrevented).toBe(false);

    // Month change MUST NOT be triggered
    expect(onMonthChange).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
  });

  it('CalendarPopover dynamically attaches native listener via containerRef, isolates page scroll, and supports month change', async () => {
    function CalendarWrapper() {
      const { togglePanel } = useDropdownManager();
      return (
        <div>
          <button data-testid="open-calendar" onClick={() => togglePanel('calendar')}>
            Open
          </button>
          <CalendarPopover />
        </div>
      );
    }

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <DropdownManagerProvider>
          <CalendarWrapper />
        </DropdownManagerProvider>
      );
    });

    // Open calendar
    const openBtn = container.querySelector('[data-testid="open-calendar"]') as HTMLButtonElement;
    await act(async () => {
      openBtn.click();
    });

    // Panel should have overscroll-contain
    const panel = container.querySelector('.overscroll-contain') as HTMLElement;
    expect(panel).not.toBeNull();

    // Internal task list container exists and has both overflow-y-auto and overscroll-contain
    const taskList = container.querySelector('.overflow-y-auto');
    expect(taskList).not.toBeNull();
    expect(taskList?.classList.contains('overscroll-contain')).toBe(true);

    // Initial month text
    const initialHeader = container.querySelector('span.text-xs.font-semibold')?.textContent;
    expect(initialHeader).toBeDefined();

    // Dispatch native wheel event on the panel
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 60,
      bubbles: true,
      cancelable: true,
    });

    await act(async () => {
      panel.dispatchEvent(wheelEvent);
    });

    // Page scroll MUST be prevented
    expect(wheelEvent.defaultPrevented).toBe(true);
    expect(window.scrollY).toBe(0);
    expect(document.documentElement.scrollTop).toBe(0);

    // Month should have transitioned
    const newHeader = container.querySelector('span.text-xs.font-semibold')?.textContent;
    expect(newHeader).not.toBe(initialHeader);

    await act(async () => {
      root.unmount();
    });
  });
});
