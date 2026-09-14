import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { PerformanceProvider, usePerformance, type PerformanceContextValue } from '@/providers/PerformanceProvider';
import { PerformanceToggle } from '@/components/layout/PerformanceToggle';
import { _resetCachedInspection } from '@/lib/hardware/performanceDetector';

// Inform React 19 that this is an act environment
// @ts-expect-error React act environment flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Helper component to inspect provider values in tests
function TestConsumer({ onRender }: { onRender: (val: ReturnType<typeof usePerformance>) => void }) {
  const val = usePerformance();
  onRender(val);
  return <div data-testid="consumer">{val.mode}:{String(val.isLiteActive)}</div>;
}

describe('PerformanceProvider & PerformanceToggle integration tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    _resetCachedInspection();
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();
    document.documentElement.classList.remove('lite-mode');

    // Default window.matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Default canvas getContext fallback in jsdom to avoid not-implemented console noise
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    // Default navigator.hardwareConcurrency mock (8 cores = high-end)
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 8,
      configurable: true,
    });
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    _resetCachedInspection();
    localStorage.clear();
    document.documentElement.classList.remove('lite-mode');
    vi.restoreAllMocks();
  });

  it('mounts with default auto mode on powerful device without adding lite-mode class', async () => {
    let capturedVal!: PerformanceContextValue;
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PerformanceProvider defaultMode="auto">
          <TestConsumer onRender={(val) => { capturedVal = val; }} />
        </PerformanceProvider>
      );
    });

    expect(capturedVal.mode).toBe('auto');
    expect(capturedVal.isLiteActive).toBe(false);
    expect(document.documentElement.classList.contains('lite-mode')).toBe(false);

    await act(async () => {
      root.unmount();
    });
  });

  it('restores stored mode "lite" from localStorage and adds lite-mode class to <html>', async () => {
    localStorage.setItem('flowstate-performance-mode', 'lite');
    let capturedVal!: PerformanceContextValue;
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PerformanceProvider>
          <TestConsumer onRender={(val) => { capturedVal = val; }} />
        </PerformanceProvider>
      );
    });

    expect(capturedVal.mode).toBe('lite');
    expect(capturedVal.isLiteActive).toBe(true);
    expect(document.documentElement.classList.contains('lite-mode')).toBe(true);

    await act(async () => {
      root.unmount();
    });

    // Verifies unmount cleanup removes .lite-mode
    expect(document.documentElement.classList.contains('lite-mode')).toBe(false);
  });

  it('allows cycling mode auto -> lite -> full -> auto via cycleMode()', async () => {
    let capturedVal!: PerformanceContextValue;
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PerformanceProvider defaultMode="auto">
          <TestConsumer onRender={(val) => { capturedVal = val; }} />
        </PerformanceProvider>
      );
    });

    expect(capturedVal.mode).toBe('auto');

    // 1st cycle -> lite
    await act(async () => {
      capturedVal.cycleMode();
    });
    expect(capturedVal.mode).toBe('lite');
    expect(capturedVal.isLiteActive).toBe(true);
    expect(document.documentElement.classList.contains('lite-mode')).toBe(true);
    expect(localStorage.getItem('flowstate-performance-mode')).toBe('lite');

    // 2nd cycle -> full
    await act(async () => {
      capturedVal.cycleMode();
    });
    expect(capturedVal.mode).toBe('full');
    expect(capturedVal.isLiteActive).toBe(false);
    expect(document.documentElement.classList.contains('lite-mode')).toBe(false);
    expect(localStorage.getItem('flowstate-performance-mode')).toBe('full');

    // 3rd cycle -> auto
    await act(async () => {
      capturedVal.cycleMode();
    });
    expect(capturedVal.mode).toBe('auto');
    expect(localStorage.getItem('flowstate-performance-mode')).toBe('auto');

    await act(async () => {
      root.unmount();
    });
  });

  it('PerformanceToggle renders correct tooltip and changes mode on click', async () => {
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PerformanceProvider defaultMode="auto">
          <PerformanceToggle />
        </PerformanceProvider>
      );
    });

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.getAttribute('title')).toContain('Hiệu năng: Tự động (Đồ họa đầy đủ)');

    // Click button to cycle to lite
    await act(async () => {
      button?.click();
    });

    expect(button?.getAttribute('title')).toContain('Hiệu năng: Luôn bật Lite Mode');
    expect(document.documentElement.classList.contains('lite-mode')).toBe(true);

    // Click button to cycle to full
    await act(async () => {
      button?.click();
    });

    expect(button?.getAttribute('title')).toContain('Hiệu năng: Luôn bật Đồ họa đầy đủ');
    expect(document.documentElement.classList.contains('lite-mode')).toBe(false);

    await act(async () => {
      root.unmount();
    });
  });

  it('PerformanceToggle displays accurate reason when reduced-motion is enabled on high-end device', async () => {
    // prefers-reduced-motion is true
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PerformanceProvider defaultMode="auto">
          <PerformanceToggle />
        </PerformanceProvider>
      );
    });

    const button = container.querySelector('button');
    const tooltip = button?.getAttribute('title');

    // Crucial bug defense verification: Must not call a high-end machine "máy yếu"
    expect(tooltip).toContain('chế độ giảm chuyển động');
    expect(tooltip).not.toContain('máy yếu');

    await act(async () => {
      root.unmount();
    });
  });

  it('PerformanceToggle displays "máy ảo / đồ họa phần mềm" when software rasterizer is detected', async () => {
    const mockGl = {
      getExtension: vi.fn((ext: string) => {
        if (ext === 'WEBGL_debug_renderer_info') {
          return { UNMASKED_RENDERER_WEBGL: 0x9246, UNMASKED_VENDOR_WEBGL: 0x9245 };
        }
        if (ext === 'WEBGL_lose_context') return { loseContext: vi.fn() };
        return null;
      }),
      getParameter: vi.fn((param: number) => {
        if (param === 0x9246) return 'llvmpipe';
        return 'Mesa';
      }),
    };

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      if (tagName === 'canvas') {
        const fakeCanvas = originalCreateElement('canvas', options);
        fakeCanvas.getContext = vi.fn().mockReturnValue(mockGl);
        return fakeCanvas;
      }
      return originalCreateElement(tagName, options);
    });

    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PerformanceProvider defaultMode="auto">
          <PerformanceToggle />
        </PerformanceProvider>
      );
    });

    const button = container.querySelector('button');
    const tooltip = button?.getAttribute('title');
    expect(tooltip).toContain('máy ảo / đồ họa phần mềm');

    await act(async () => {
      root.unmount();
    });
  });
});
