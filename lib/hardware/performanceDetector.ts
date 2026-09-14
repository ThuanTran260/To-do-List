export type PerformanceMode = 'auto' | 'lite' | 'full';

export interface HardwareInspectionResult {
  isSoftwareRasterizer: boolean;
  renderer: string;
  vendor: string;
  cores: number;
  prefersReducedMotion: boolean;
  isLowEnd: boolean;
}

const SOFTWARE_RASTERIZER_TOKENS = [
  'llvmpipe',
  'softpipe',
  'swiftshader',
  'software rasterizer',
  'mesa off-screen',
  'virtualbox',
  'vmware',
  'vmwgfx',
  'qemu',
  'virgl',
];

let cachedInspection: HardwareInspectionResult | null = null;

/**
 * Thăm dò phần cứng thông qua WebGL và Hardware APIs với cơ chế tự dọn dẹp WebGL Context.
 * Chạy an toàn cả trong môi trường SSR lẫn CSR. Kết quả được cache trọn vòng đời app.
 */
export function inspectHardware(): HardwareInspectionResult {
  if (cachedInspection) return cachedInspection;

  if (typeof window === 'undefined') {
    return {
      isSoftwareRasterizer: false,
      renderer: 'SSR',
      vendor: 'Server',
      cores: 4,
      prefersReducedMotion: false,
      isLowEnd: false,
    };
  }

  let renderer = '';
  let vendor = '';
  let isSoftwareRasterizer = false;

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (gl && (typeof WebGLRenderingContext === 'undefined' || gl instanceof WebGLRenderingContext)) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      }
      // R2 Fix: Giải phóng ngay lập tức WebGL context để không bao giờ bị vượt hạn ngạch 8-16 context của browser
      const loseContextExt = gl.getExtension('WEBGL_lose_context');
      if (loseContextExt) {
        loseContextExt.loseContext();
      }
    }
  } catch {
    // WebGL disabled hoặc bị chặn
  }

  const combined = `${renderer} ${vendor}`.toLowerCase();
  isSoftwareRasterizer = SOFTWARE_RASTERIZER_TOKENS.some((token) => combined.includes(token));

  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Máy ảo chạy llvmpipe/swiftshader hoặc máy chỉ có 1-2 core CPU
  const isLowEnd = isSoftwareRasterizer || cores <= 2;

  cachedInspection = {
    isSoftwareRasterizer,
    renderer,
    vendor,
    cores,
    prefersReducedMotion,
    isLowEnd,
  };

  return cachedInspection;
}

export function resolveEffectiveLiteMode(
  mode: PerformanceMode,
  inspection: HardwareInspectionResult = inspectHardware()
): boolean {
  if (mode === 'lite') return true;
  if (mode === 'full') return false;

  // Mode 'auto': Ưu tiên bật Lite nếu phát hiện máy ảo/máy yếu hoặc user bật accessibility reduced motion
  return inspection.isLowEnd || inspection.prefersReducedMotion;
}

export function getNextPerformanceMode(current: PerformanceMode): PerformanceMode {
  if (current === 'auto') return 'lite';
  if (current === 'lite') return 'full';
  return 'auto';
}

/**
 * Dành riêng cho testing: xóa cache để kiểm thử các môi trường mô phỏng
 */
export function _resetCachedInspection(): void {
  cachedInspection = null;
}
