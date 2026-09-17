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

  it('safely clamps legacy focus minutes > 120 down to 120 and updates localStorage', async () => {
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

    // Verify localStorage was updated to 120
    expect(localStorage.getItem('flowstate_pomodoro_focus_minutes')).toBe('120');

    // Spinbutton rendered with value 120
    const spinbutton = container.querySelector('[role="spinbutton"]');
    expect(spinbutton).not.toBeNull();
    expect(spinbutton?.getAttribute('aria-valuenow')).toBe('120');

    await act(async () => {
      root.unmount();
    });
  });

  it('renders 3D WheelPicker in isIdle state and updates when quick preset is clicked', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PomodoroTimer />);
    });

    // Open widget
    const trigger = container.querySelector('button[title="Mở đồng hồ Pomodoro"]') as HTMLButtonElement;
    await act(async () => {
      trigger.click();
    });

    // In isIdle state, WheelPickerColumn is displayed
    const spinbutton = container.querySelector('[role="spinbutton"]');
    expect(spinbutton).not.toBeNull();
    expect(spinbutton?.getAttribute('aria-valuenow')).toBe('25');

    // Click 45p preset
    const preset45 = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === '45p'
    );
    expect(preset45).toBeDefined();
    await act(async () => {
      preset45?.click();
    });

    // Spinbutton updates to 45
    expect(container.querySelector('[role="spinbutton"]')?.getAttribute('aria-valuenow')).toBe('45');

    await act(async () => {
      root.unmount();
    });
  });

  it('preserves paused time MM:SS and hides wheel picker when paused', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<PomodoroTimer />);
    });

    // Open widget
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

    // Wheel picker is replaced by running countdown
    expect(container.querySelector('[role="spinbutton"]')).toBeNull();

    // Pause timer (Tạm dừng)
    const pauseBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Tạm dừng')
    );
    expect(pauseBtn).toBeDefined();

    await act(async () => {
      pauseBtn?.click();
    });

    // Wheel picker should STILL NOT be rendered while paused; displays paused countdown MM:SS
    expect(container.querySelector('[role="spinbutton"]')).toBeNull();
    expect(container.textContent).toContain('25:00');

    await act(async () => {
      root.unmount();
    });
  });
});
