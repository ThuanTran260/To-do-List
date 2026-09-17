import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { WheelPickerColumn } from '@/components/ui/WheelPickerColumn';
import { TimeWheelPicker } from '@/components/ui/TimeWheelPicker';
import { PomodoroTimer } from '@/components/widget/PomodoroTimer';

// Inform React 19 that this is an act environment
// @ts-expect-error React act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('WheelPickerColumn Unit & A11y Tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();

    if (typeof globalThis.PointerEvent === 'undefined') {
      class PointerEventFake extends MouseEvent {
        pointerId: number;
        constructor(type: string, params: MouseEventInit & { pointerId?: number } = {}) {
          super(type, params);
          this.pointerId = params.pointerId ?? 0;
        }
      }
      // @ts-expect-error polyfill PointerEvent in jsdom
      globalThis.PointerEvent = PointerEventFake;
    }

    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = vi.fn();
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = vi.fn();
    }
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders with WAI-ARIA spinbutton role, tabIndex, and attributes', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WheelPickerColumn
          value={25}
          onChange={vi.fn()}
          min={1}
          max={120}
          unit="phút"
          ariaLabel="Thời lượng tập trung"
        />
      );
    });

    const spinbutton = container.querySelector('[role="spinbutton"]');
    expect(spinbutton).not.toBeNull();
    expect(spinbutton?.getAttribute('tabindex')).toBe('0');
    expect(spinbutton?.getAttribute('aria-valuenow')).toBe('25');
    expect(spinbutton?.getAttribute('aria-valuemin')).toBe('1');
    expect(spinbutton?.getAttribute('aria-valuemax')).toBe('120');
    expect(spinbutton?.getAttribute('aria-label')).toBe('Thời lượng tập trung');
    expect(spinbutton?.getAttribute('aria-valuetext')).toBe('25 phút');

    await act(async () => {
      root.unmount();
    });
  });

  it('navigates with keyboard ArrowUp, ArrowDown, ArrowRight, ArrowLeft', async () => {
    const handleChange = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WheelPickerColumn
          value={25}
          onChange={handleChange}
          min={1}
          max={120}
          unit="phút"
        />
      );
    });

    const spinbutton = container.querySelector('[role="spinbutton"]') as HTMLElement;
    expect(spinbutton).not.toBeNull();

    // ArrowUp -> +1
    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith(26);

    // ArrowDown -> -1
    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith(24);

    // ArrowRight -> +1
    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith(26);

    // ArrowLeft -> -1
    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith(24);

    await act(async () => {
      root.unmount();
    });
  });

  it('supports PageUp (+15), PageDown (-15), Home (min), End (max)', async () => {
    const handleChange = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WheelPickerColumn
          value={25}
          onChange={handleChange}
          min={1}
          max={120}
          unit="phút"
        />
      );
    });

    const spinbutton = container.querySelector('[role="spinbutton"]') as HTMLElement;

    // PageUp -> +15 (25 + 15 = 40)
    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith(40);

    // PageDown -> -15 (25 - 15 = 10)
    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith(10);

    // Home -> min (1)
    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith(1);

    // End -> max (120)
    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith(120);

    await act(async () => {
      root.unmount();
    });
  });

  it('supports type-ahead digit entry', async () => {
    const handleChange = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WheelPickerColumn
          value={10}
          onChange={handleChange}
          min={1}
          max={120}
          unit="phút"
        />
      );
    });

    const spinbutton = container.querySelector('[role="spinbutton"]') as HTMLElement;

    // Type '4' then '5'
    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: '4', bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith(4);

    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: '5', bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith(45);

    await act(async () => {
      root.unmount();
    });
  });

  it('clamps value boundary at min and max without overflow', async () => {
    const handleChangeMin = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WheelPickerColumn
          value={1}
          onChange={handleChangeMin}
          min={1}
          max={120}
        />
      );
    });

    const spinbutton = container.querySelector('[role="spinbutton"]') as HTMLElement;
    await act(async () => {
      spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    // Should clamp to min 1
    expect(handleChangeMin).toHaveBeenLastCalledWith(1);

    await act(async () => {
      root.unmount();
    });

    const handleChangeMax = vi.fn();
    const root2 = createRoot(container);
    await act(async () => {
      root2.render(
        <WheelPickerColumn
          value={120}
          onChange={handleChangeMax}
          min={1}
          max={120}
        />
      );
    });

    const spinbutton2 = container.querySelector('[role="spinbutton"]') as HTMLElement;
    await act(async () => {
      spinbutton2.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });
    expect(handleChangeMax).toHaveBeenLastCalledWith(120);

    await act(async () => {
      root2.unmount();
    });
  });

  it('renders only virtual window of at most 5 items (|idx - current| <= 2)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WheelPickerColumn
          value={50}
          onChange={vi.fn()}
          min={1}
          max={120}
        />
      );
    });

    const items = container.querySelectorAll('[data-wheel-item]');
    // Exactly 5 items for center value: 48, 49, 50, 51, 52
    expect(items.length).toBe(5);
    const renderedValues = Array.from(items).map((el) => Number(el.getAttribute('data-wheel-item')));
    expect(renderedValues).toEqual([48, 49, 50, 51, 52]);

    await act(async () => {
      root.unmount();
    });

    // Boundary at min=1: only 3 items: 1, 2, 3
    const rootMin = createRoot(container);
    await act(async () => {
      rootMin.render(
        <WheelPickerColumn
          value={1}
          onChange={vi.fn()}
          min={1}
          max={120}
        />
      );
    });

    const minItems = container.querySelectorAll('[data-wheel-item]');
    expect(minItems.length).toBe(3);
    const minValues = Array.from(minItems).map((el) => Number(el.getAttribute('data-wheel-item')));
    expect(minValues).toEqual([1, 2, 3]);

    await act(async () => {
      rootMin.unmount();
    });
  });

  it('handles mouse wheel event with preventDefault and accumulator', async () => {
    const handleChange = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WheelPickerColumn
          value={25}
          onChange={handleChange}
          min={1}
          max={120}
        />
      );
    });

    const spinbutton = container.querySelector('[role="spinbutton"]') as HTMLElement;

    // Small scroll < threshold (e.g. 20px) should not trigger change yet
    await act(async () => {
      const smallWheel = new WheelEvent('wheel', { deltaY: 20, bubbles: true, cancelable: true });
      spinbutton.dispatchEvent(smallWheel);
    });
    expect(handleChange).not.toHaveBeenCalled();

    // Additional scroll reaching threshold >= 36px triggers increment
    await act(async () => {
      const moreWheel = new WheelEvent('wheel', { deltaY: 20, bubbles: true, cancelable: true });
      spinbutton.dispatchEvent(moreWheel);
    });
    expect(handleChange).toHaveBeenCalledWith(26);

    await act(async () => {
      root.unmount();
    });
  });

  it('handles pointer drag with pointer capture', async () => {
    const handleChange = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WheelPickerColumn
          value={25}
          onChange={handleChange}
          min={1}
          max={120}
        />
      );
    });

    const spinbutton = container.querySelector('[role="spinbutton"]') as HTMLElement;

    await act(async () => {
      spinbutton.dispatchEvent(
        new PointerEvent('pointerdown', { pointerId: 1, clientY: 200, bubbles: true })
      );
    });
    expect(Element.prototype.setPointerCapture).toHaveBeenCalledWith(1);

    // Drag upwards by 36px (from 200 to 164) -> increments value by 1 step
    await act(async () => {
      spinbutton.dispatchEvent(
        new PointerEvent('pointermove', { pointerId: 1, clientY: 164, bubbles: true })
      );
    });
    expect(handleChange).toHaveBeenCalledWith(26);

    // Pointer up releases capture
    await act(async () => {
      spinbutton.dispatchEvent(
        new PointerEvent('pointerup', { pointerId: 1, clientY: 164, bubbles: true })
      );
    });
    expect(Element.prototype.releasePointerCapture).toHaveBeenCalledWith(1);

    await act(async () => {
      root.unmount();
    });
  });
});

describe('TimeWheelPicker 2-Column Composition & Backward Compatibility', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('composes two WheelPickerColumn instances for Hours (0..23) and Minutes (0..59)', async () => {
    const onChangeHours = vi.fn();
    const onChangeMinutes = vi.fn();
    const onConfirm = vi.fn();

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <TimeWheelPicker
          hours="09"
          minutes="45"
          onChangeHours={onChangeHours}
          onChangeMinutes={onChangeMinutes}
          onConfirm={onConfirm}
        />
      );
    });

    const columns = container.querySelectorAll('[role="spinbutton"]');
    expect(columns.length).toBe(2);

    const hoursColumn = columns[0] as HTMLElement;
    const minutesColumn = columns[1] as HTMLElement;

    expect(hoursColumn.getAttribute('aria-valuenow')).toBe('9');
    expect(hoursColumn.getAttribute('aria-valuemin')).toBe('0');
    expect(hoursColumn.getAttribute('aria-valuemax')).toBe('23');

    expect(minutesColumn.getAttribute('aria-valuenow')).toBe('45');
    expect(minutesColumn.getAttribute('aria-valuemin')).toBe('0');
    expect(minutesColumn.getAttribute('aria-valuemax')).toBe('59');

    // Confirm button triggers onConfirm
    const confirmBtn = container.querySelector('button') as HTMLButtonElement;
    await act(async () => {
      confirmBtn.click();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
    });
  });
});

describe('PomodoroTimer Wheel Integration & State Machine', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    localStorage.clear();
  });

  it('safely migrates legacy focus minutes > 120 to v2 storage key, clamps to 120, and deletes legacy key', async () => {
    localStorage.setItem('flowstate_pomodoro_focus_minutes', '180');

    const root = createRoot(container);
    await act(async () => {
      root.render(<PomodoroTimer />);
    });

    // Open widget
    const trigger = container.querySelector('button[title="Mở đồng hồ Pomodoro"]') as HTMLButtonElement;
    await act(async () => {
      trigger.click();
    });

    // Legacy key deleted and v2 key created with clamped mins = 120, secs = 0
    expect(localStorage.getItem('flowstate_pomodoro_focus_minutes')).toBeNull();
    const v2Raw = localStorage.getItem('flowstate_pomodoro_focus_v2');
    expect(v2Raw).not.toBeNull();
    const parsedV2 = JSON.parse(v2Raw!);
    expect(parsedV2).toEqual({ v: 2, mins: 120, secs: 0 });

    // Both spinbuttons rendered
    const spinbuttons = container.querySelectorAll('[role="spinbutton"]');
    expect(spinbuttons.length).toBe(2);
    expect(spinbuttons[0].getAttribute('aria-valuenow')).toBe('120');
    expect(spinbuttons[1].getAttribute('aria-valuenow')).toBe('0');

    await act(async () => {
      root.unmount();
    });
  });

  it('handles post-mount hydration sync smoothly without mismatch and updates formattedTime', async () => {
    // Pre-seed v2 storage with 15 minutes, 30 seconds
    localStorage.setItem(
      'flowstate_pomodoro_focus_v2',
      JSON.stringify({ v: 2, mins: 15, secs: 30 })
    );

    const root = createRoot(container);
    await act(async () => {
      root.render(<PomodoroTimer />);
    });

    // After mount, trigger button should immediately display the synced time 15:30
    const triggerSpan = container.querySelector('button[title="Mở đồng hồ Pomodoro"] span');
    expect(triggerSpan?.textContent).toBe('15:30');

    // Open widget and verify 2 spinbuttons reflect synced values
    const trigger = container.querySelector('button[title="Mở đồng hồ Pomodoro"]') as HTMLButtonElement;
    await act(async () => {
      trigger.click();
    });

    const spinbuttons = container.querySelectorAll('[role="spinbutton"]');
    expect(spinbuttons.length).toBe(2);
    expect(spinbuttons[0].getAttribute('aria-valuenow')).toBe('15');
    expect(spinbuttons[1].getAttribute('aria-valuenow')).toBe('30');

    await act(async () => {
      root.unmount();
    });
  });

  it('renders 2 columns (Phút and Giây) with colon separator in isIdle state', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PomodoroTimer />);
    });

    // Open widget
    const trigger = container.querySelector('button[title="Mở đồng hồ Pomodoro"]') as HTMLButtonElement;
    await act(async () => {
      trigger.click();
    });

    const spinbuttons = container.querySelectorAll('[role="spinbutton"]');
    expect(spinbuttons.length).toBe(2);

    const minutesColumn = spinbuttons[0] as HTMLElement;
    const secondsColumn = spinbuttons[1] as HTMLElement;

    expect(minutesColumn.getAttribute('aria-label')).toBe('Số phút tập trung');
    expect(minutesColumn.getAttribute('aria-valuenow')).toBe('25');
    expect(minutesColumn.getAttribute('aria-valuemin')).toBe('0');
    expect(minutesColumn.getAttribute('aria-valuemax')).toBe('120');

    expect(secondsColumn.getAttribute('aria-label')).toBe('Số giây tập trung');
    expect(secondsColumn.getAttribute('aria-valuenow')).toBe('0');
    expect(secondsColumn.getAttribute('aria-valuemin')).toBe('0');
    expect(secondsColumn.getAttribute('aria-valuemax')).toBe('59');

    // Colon separator is present
    expect(container.textContent).toContain(':');

    await act(async () => {
      root.unmount();
    });
  });

  it('adjusts seconds with loop (59 -> 00) and ensures independent columns (no carry/borrow to minutes)', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PomodoroTimer />);
    });

    const trigger = container.querySelector('button[title="Mở đồng hồ Pomodoro"]') as HTMLButtonElement;
    await act(async () => {
      trigger.click();
    });

    const spinbuttons = container.querySelectorAll('[role="spinbutton"]');
    const minutesColumn = spinbuttons[0] as HTMLElement;
    const secondsColumn = spinbuttons[1] as HTMLElement;

    expect(minutesColumn.getAttribute('aria-valuenow')).toBe('25');
    expect(secondsColumn.getAttribute('aria-valuenow')).toBe('0');

    // ArrowDown on seconds column: wraps 00 -> 59 (with loop=true)
    await act(async () => {
      secondsColumn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });

    // Seconds should be 59
    expect(secondsColumn.getAttribute('aria-valuenow')).toBe('59');
    // Minutes column MUST NOT carry/borrow — remains 25!
    expect(minutesColumn.getAttribute('aria-valuenow')).toBe('25');

    // ArrowUp on seconds column: wraps 59 -> 00
    await act(async () => {
      secondsColumn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });

    expect(secondsColumn.getAttribute('aria-valuenow')).toBe('0');
    // Minutes column remains 25!
    expect(minutesColumn.getAttribute('aria-valuenow')).toBe('25');

    await act(async () => {
      root.unmount();
    });
  });

  it('resets seconds to 00 and updates minutes when quick preset is clicked', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PomodoroTimer />);
    });

    const trigger = container.querySelector('button[title="Mở đồng hồ Pomodoro"]') as HTMLButtonElement;
    await act(async () => {
      trigger.click();
    });

    const spinbuttons = container.querySelectorAll('[role="spinbutton"]');
    const secondsColumn = spinbuttons[1] as HTMLElement;

    // Change seconds to 15 (PageUp on seconds)
    await act(async () => {
      secondsColumn.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
    });
    expect(secondsColumn.getAttribute('aria-valuenow')).toBe('15');

    // Click 45p preset
    const preset45 = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === '45p'
    );
    expect(preset45).toBeDefined();
    await act(async () => {
      preset45?.click();
    });

    // Spinbuttons: minutes should be 45, seconds should be reset to 0
    expect(spinbuttons[0].getAttribute('aria-valuenow')).toBe('45');
    expect(spinbuttons[1].getAttribute('aria-valuenow')).toBe('0');

    // 45p button should have active highlight
    expect(preset45?.className).toContain('bg-primary');

    await act(async () => {
      root.unmount();
    });
  });

  it('disables Bắt đầu button and guards against timer start when duration is 00:00', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PomodoroTimer />);
    });

    const trigger = container.querySelector('button[title="Mở đồng hồ Pomodoro"]') as HTMLButtonElement;
    await act(async () => {
      trigger.click();
    });

    const spinbuttons = container.querySelectorAll('[role="spinbutton"]');
    const minutesColumn = spinbuttons[0] as HTMLElement;

    // Set minutes to 0 (Home key)
    await act(async () => {
      minutesColumn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });
    expect(minutesColumn.getAttribute('aria-valuenow')).toBe('0');
    expect(spinbuttons[1].getAttribute('aria-valuenow')).toBe('0');

    // Start button should be disabled
    const startBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Bắt đầu')
    );
    expect(startBtn).toBeDefined();
    expect(startBtn?.hasAttribute('disabled')).toBe(true);

    // Clicking disabled start button should not start timer
    await act(async () => {
      startBtn?.click();
    });

    // Spinbuttons remain visible (still idle, not started)
    expect(container.querySelectorAll('[role="spinbutton"]').length).toBe(2);

    await act(async () => {
      root.unmount();
    });
  });

  it('preserves both minutes and seconds when paused and when reset', async () => {
    // Seed storage with 25 mins and 30 secs
    localStorage.setItem(
      'flowstate_pomodoro_focus_v2',
      JSON.stringify({ v: 2, mins: 25, secs: 30 })
    );

    const root = createRoot(container);
    await act(async () => {
      root.render(<PomodoroTimer />);
    });

    const trigger = container.querySelector('button[title="Mở đồng hồ Pomodoro"]') as HTMLButtonElement;
    await act(async () => {
      trigger.click();
    });

    // Start timer (Bắt đầu)
    const startBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Bắt đầu')
    );
    expect(startBtn).toBeDefined();

    await act(async () => {
      startBtn?.click();
    });

    // Wheel picker replaced by running countdown
    expect(container.querySelector('[role="spinbutton"]')).toBeNull();

    // Pause timer (Tạm dừng)
    const pauseBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Tạm dừng')
    );
    expect(pauseBtn).toBeDefined();

    await act(async () => {
      pauseBtn?.click();
    });

    // While paused, displays paused countdown MM:SS and (Tạm dừng)
    expect(container.querySelector('[role="spinbutton"]')).toBeNull();
    expect(container.textContent).toContain('25:30');
    expect(container.textContent).toContain('(Tạm dừng)');

    // Reset timer (Đặt lại)
    const resetBtn = container.querySelector('button[title="Đặt lại"]') as HTMLButtonElement;
    expect(resetBtn).toBeDefined();

    await act(async () => {
      resetBtn.click();
    });

    // Wheel picker is restored with both minutes (25) and seconds (30)
    const spinbuttons = container.querySelectorAll('[role="spinbutton"]');
    expect(spinbuttons.length).toBe(2);
    expect(spinbuttons[0].getAttribute('aria-valuenow')).toBe('25');
    expect(spinbuttons[1].getAttribute('aria-valuenow')).toBe('30');

    await act(async () => {
      root.unmount();
    });
  });

  it('handles break mode: displays coffee icon countdown, hides wheel picker, and restores both columns on mode transition back to focus', async () => {
    vi.useFakeTimers();
    try {
      const root = createRoot(container);
      await act(async () => {
        root.render(<PomodoroTimer />);
      });

      // Open widget
      const trigger = container.querySelector('button[title="Mở đồng hồ Pomodoro"]') as HTMLButtonElement;
      await act(async () => {
        trigger.click();
      });

      // Start focus timer (Bắt đầu)
      const startBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Bắt đầu')
      );
      expect(startBtn).toBeDefined();
      await act(async () => {
        startBtn?.click();
      });

      // Advance timers by 25 minutes (1500 seconds) so focus session completes
      await act(async () => {
        vi.advanceTimersByTime(1500 * 1000);
      });

      // Focus session completed! Mode should now be 'break'
      // 1. Header should show "Nghỉ Giải Lao"
      expect(container.textContent).toContain('Nghỉ Giải Lao');
      // 2. Wheel picker is NOT rendered
      expect(container.querySelector('[role="spinbutton"]')).toBeNull();
      // 3. Coffee cup break message is shown
      expect(container.textContent).toContain('Nghỉ ngơi lấy lại năng lượng');
      // 4. Default break time 05:00 is displayed
      expect(container.textContent).toContain('05:00');

      // Start break timer
      const startBreakBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Bắt đầu')
      );
      expect(startBreakBtn).toBeDefined();
      await act(async () => {
        startBreakBtn?.click();
      });

      // Advance 60s into break
      await act(async () => {
        vi.advanceTimersByTime(60 * 1000);
      });
      expect(container.textContent).toContain('04:00');

      // Pause break timer
      const pauseBreakBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Tạm dừng')
      );
      expect(pauseBreakBtn).toBeDefined();
      await act(async () => {
        pauseBreakBtn?.click();
      });

      // Paused state in break mode: shows (Tạm dừng) and button says "Tiếp tục"
      expect(container.textContent).toContain('Nghỉ giải lao (Tạm dừng)');
      const resumeBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Tiếp tục')
      );
      expect(resumeBtn).toBeDefined();

      // Resume and finish the break timer (remaining 240 seconds)
      await act(async () => {
        resumeBtn?.click();
      });
      await act(async () => {
        vi.advanceTimersByTime(240 * 1000);
      });

      // Break finished! Mode transitions back to 'focus'
      // hasStarted is reset to false, isIdle is true!
      // Wheel picker should be restored for the next session with both columns!
      expect(container.textContent).toContain('Phiên Tập Trung');
      const restoredSpinbuttons = container.querySelectorAll('[role="spinbutton"]');
      expect(restoredSpinbuttons.length).toBe(2);
      expect(restoredSpinbuttons[0].getAttribute('aria-valuenow')).toBe('25');
      expect(restoredSpinbuttons[1].getAttribute('aria-valuenow')).toBe('0');

      await act(async () => {
        root.unmount();
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
