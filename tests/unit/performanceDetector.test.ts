import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  inspectHardware,
  resolveEffectiveLiteMode,
  getNextPerformanceMode,
  _resetCachedInspection,
  type PerformanceMode,
} from '@/lib/hardware/performanceDetector';

describe('performanceDetector.getNextPerformanceMode', () => {
  it('cycles correctly through auto -> lite -> full -> auto', () => {
    expect(getNextPerformanceMode('auto')).toBe('lite');
    expect(getNextPerformanceMode('lite')).toBe('full');
    expect(getNextPerformanceMode('full')).toBe('auto');
    expect(getNextPerformanceMode('invalid' as PerformanceMode)).toBe('auto');
  });
});

describe('performanceDetector.resolveEffectiveLiteMode', () => {
  it('always activates lite mode when mode is "lite"', () => {
    expect(
      resolveEffectiveLiteMode('lite', {
        isSoftwareRasterizer: false,
        renderer: 'NVIDIA RTX 4090',
        vendor: 'NVIDIA',
        cores: 16,
        prefersReducedMotion: false,
        isLowEnd: false,
      })
    ).toBe(true);
  });

  it('never activates lite mode when mode is "full"', () => {
    expect(
      resolveEffectiveLiteMode('full', {
        isSoftwareRasterizer: true,
        renderer: 'llvmpipe',
        vendor: 'Mesa',
        cores: 1,
        prefersReducedMotion: true,
        isLowEnd: true,
      })
    ).toBe(false);
  });

  it('activates lite mode in "auto" if software rasterizer detected', () => {
    expect(
      resolveEffectiveLiteMode('auto', {
        isSoftwareRasterizer: true,
        renderer: 'llvmpipe (LLVM 12.0.0, 256 bits)',
        vendor: 'Mesa',
        cores: 4,
        prefersReducedMotion: false,
        isLowEnd: true,
      })
    ).toBe(true);
  });

  it('activates lite mode in "auto" if prefers-reduced-motion is true', () => {
    expect(
      resolveEffectiveLiteMode('auto', {
        isSoftwareRasterizer: false,
        renderer: 'Intel Iris',
        vendor: 'Intel',
        cores: 8,
        prefersReducedMotion: true,
        isLowEnd: false,
      })
    ).toBe(true);
  });

  it('keeps lite mode off in "auto" on powerful hardware without reduced motion', () => {
    expect(
      resolveEffectiveLiteMode('auto', {
        isSoftwareRasterizer: false,
        renderer: 'Apple M3 Pro',
        vendor: 'Apple',
        cores: 12,
        prefersReducedMotion: false,
        isLowEnd: false,
      })
    ).toBe(false);
  });

  it('activates lite mode in "auto" if cores <= 2 even without software rasterizer', () => {
    expect(
      resolveEffectiveLiteMode('auto', {
        isSoftwareRasterizer: false,
        renderer: 'Intel HD Graphics 4000',
        vendor: 'Intel',
        cores: 2,
        prefersReducedMotion: false,
        isLowEnd: true,
      })
    ).toBe(true);
  });
});

describe('performanceDetector.inspectHardware (SSR Safety & WebGL Probe)', () => {
  beforeEach(() => {
    _resetCachedInspection();
  });

  afterEach(() => {
    _resetCachedInspection();
    vi.restoreAllMocks();
  });

  it('returns safe fallback in SSR environment without crashing', () => {
    const originalWindow = global.window;
    // @ts-expect-error simulate SSR
    delete global.window;

    try {
      const res = inspectHardware();
      expect(res).toBeDefined();
      expect(res.renderer).toBe('SSR');
      expect(res.vendor).toBe('Server');
      expect(res.cores).toBe(4);
      expect(res.isLowEnd).toBe(false);
    } finally {
      global.window = originalWindow;
    }
  });

  it('detects software rasterizer llvmpipe and calls loseContext cleanup', () => {
    const loseContextMock = vi.fn();
    const mockGl = {
      getExtension: vi.fn((ext: string) => {
        if (ext === 'WEBGL_debug_renderer_info') {
          return {
            UNMASKED_RENDERER_WEBGL: 0x9246,
            UNMASKED_VENDOR_WEBGL: 0x9245,
          };
        }
        if (ext === 'WEBGL_lose_context') {
          return { loseContext: loseContextMock };
        }
        return null;
      }),
      getParameter: vi.fn((param: number) => {
        if (param === 0x9246) return 'llvmpipe (LLVM 14.0.0, 256 bits)';
        if (param === 0x9245) return 'Mesa/X.org';
        return '';
      }),
    };

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn().mockReturnValue(mockGl),
    } as unknown as HTMLCanvasElement);

    const res = inspectHardware();

    expect(createElementSpy).toHaveBeenCalledWith('canvas');
    expect(loseContextMock).toHaveBeenCalledTimes(1);
    expect(res.isSoftwareRasterizer).toBe(true);
    expect(res.isLowEnd).toBe(true);
    expect(res.renderer).toBe('llvmpipe (LLVM 14.0.0, 256 bits)');
    expect(res.vendor).toBe('Mesa/X.org');
  });

  it('identifies dedicated GPU (NVIDIA) as not low-end on multi-core machine', () => {
    const loseContextMock = vi.fn();
    const mockGl = {
      getExtension: vi.fn((ext: string) => {
        if (ext === 'WEBGL_debug_renderer_info') {
          return {
            UNMASKED_RENDERER_WEBGL: 0x9246,
            UNMASKED_VENDOR_WEBGL: 0x9245,
          };
        }
        if (ext === 'WEBGL_lose_context') {
          return { loseContext: loseContextMock };
        }
        return null;
      }),
      getParameter: vi.fn((param: number) => {
        if (param === 0x9246) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0)';
        if (param === 0x9245) return 'Google Inc. (NVIDIA)';
        return '';
      }),
    };

    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn().mockReturnValue(mockGl),
    } as unknown as HTMLCanvasElement);

    // Mock hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 8,
      configurable: true,
    });

    const res = inspectHardware();

    expect(loseContextMock).toHaveBeenCalledTimes(1);
    expect(res.isSoftwareRasterizer).toBe(false);
    expect(res.isLowEnd).toBe(false);
  });

  it('memoizes inspection result across multiple calls without re-querying canvas', () => {
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(null),
    } as unknown as HTMLCanvasElement;
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas);

    const first = inspectHardware();
    const second = inspectHardware();

    expect(first).toBe(second);
    expect(createElementSpy).toHaveBeenCalledTimes(1);
  });

  it('handles gracefully when WebGL context creation throws or returns null', () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn().mockImplementation(() => {
        throw new Error('WebGL not supported');
      }),
    } as unknown as HTMLCanvasElement);

    const res = inspectHardware();

    expect(res).toBeDefined();
    expect(res.isSoftwareRasterizer).toBe(false);
  });
});
