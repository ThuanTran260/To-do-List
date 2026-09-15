import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Modal } from '@/components/ui/Modal';
import { PriorityBadge } from '@/components/ui/Badge';
import { CustomPrioritySelect } from '@/components/ui/CustomPrioritySelect';

// Inform React 19 that this is an act environment
// @ts-expect-error React act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
});
