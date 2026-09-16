export type PerformanceMode = 'auto' | 'lite' | 'full';

export const INSPECTION_SCHEMA_VERSION = 2;

export interface HardwareInspectionResult {
  schemaVersion?: number;    // Optional để tương thích ngược với mock test fixtures & SSR literals
  isSoftwareRasterizer: boolean;
  renderer: string;
  vendor: string;
  cores: number;
  memoryGb?: number;         // navigator.deviceMemory (GB) - chỉ Chromium hỗ trợ, fallback undefined
  maxTextureSize?: number;   // gl.MAX_TEXTURE_SIZE - signal phụ, fallback undefined
  isDesktop?: boolean;        // matchMedia('(pointer: fine)') - signal phụ
  isDedicatedGpu?: boolean;   // regex NVIDIA/AMD/Apple/Intel Arc - signal phụ
  prefersReducedMotion: boolean;
  isLowEnd: boolean;         // Gate cứng tối thiểu: isSoftwareRasterizer || cores <= 2
}

const SOFTWARE_RASTERIZER_TOKENS = [
  'llvmpipe',
  'softpipe',
  'swiftshader',
  'software rasterizer',
  'software renderer',
  'mesa off-screen',
  'virtualbox',
  'vmware',
  'vmwgfx',
  'qemu',
  'virgl',
  'basic render',
  'microsoft basic render driver',
  'lavapipe',
  'parallels',
];

let cachedInspection: HardwareInspectionResult | null = null;

/**
 * Thăm dò phần cứng thông qua WebGL và Hardware APIs với cơ chế tự dọn dẹp WebGL Context.
 * Chạy an toàn cả trong môi trường SSR lẫn CSR. Kết quả được cache trọn vòng đời app.
 */
export function inspectHardware(): HardwareInspectionResult {
  if (cachedInspection && cachedInspection.schemaVersion === INSPECTION_SCHEMA_VERSION) {
    return cachedInspection;
  }

  if (typeof window === 'undefined') {
    return {
      schemaVersion: INSPECTION_SCHEMA_VERSION,
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
  let maxTextureSize: number | undefined;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (gl && typeof gl.getExtension === 'function') {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      }
      // Standard WebGL fallback if unmasked debug extension is unavailable or restricted
      if (!renderer && typeof gl.getParameter === 'function') {
        renderer = gl.getParameter(gl.RENDERER) || '';
        vendor = gl.getParameter(gl.VENDOR) || '';
      }
      if (typeof gl.getParameter === 'function' && typeof gl.MAX_TEXTURE_SIZE !== 'undefined') {
        try {
          maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || undefined;
        } catch {
          maxTextureSize = undefined;
        }
      }
      // R2 Fix: Giải phóng ngay lập tức WebGL context để không bao giờ bị vượt hạn ngạch 8-16 context của browser
      const loseContextExt = gl.getExtension('WEBGL_lose_context');
      if (loseContextExt && typeof loseContextExt.loseContext === 'function') {
        loseContextExt.loseContext();
      }
    }
  } catch {
    // WebGL disabled hoặc bị chặn
  }

  const combined = `${renderer} ${vendor}`.toLowerCase();
  isSoftwareRasterizer = SOFTWARE_RASTERIZER_TOKENS.some((token) => combined.includes(token));

  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

  let memoryGb: number | undefined;
  try {
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      memoryGb = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    }
  } catch {
    memoryGb = undefined;
  }

  let isDesktop: boolean | undefined;
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      isDesktop = Boolean(window.matchMedia('(pointer: fine)').matches);
    }
  } catch {
    isDesktop = undefined;
  }

  const isDedicatedGpu = Boolean(
    /(nvidia|geforce|quadro|rtx|gtx|radeon|amd|apple m|intel arc)/i.test(combined) &&
      !isSoftwareRasterizer
  );

  let prefersReducedMotion = false;
  try {
    prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch {
    prefersReducedMotion = false;
  }

  // Máy ảo chạy llvmpipe/swiftshader hoặc máy chỉ có 1-2 core CPU
  const isLowEnd = isSoftwareRasterizer || cores <= 2;

  cachedInspection = {
    schemaVersion: INSPECTION_SCHEMA_VERSION,
    isSoftwareRasterizer,
    renderer,
    vendor,
    cores,
    memoryGb,
    maxTextureSize,
    isDesktop,
    isDedicatedGpu,
    prefersReducedMotion,
    isLowEnd,
  };

  return cachedInspection;
}

/**
 * Trục 1: Độ trung thực đồ họa (Fidelity)
 * Điều khiển class .lite-mode trên <html> và CSS variables.
 */
export function resolveFidelityLite(
  mode: PerformanceMode,
  inspection: HardwareInspectionResult = inspectHardware()
): boolean {
  if (mode === 'lite') return true;
  if (mode === 'full') return false;
  const resolved = inspection || inspectHardware();
  return Boolean(resolved.isLowEnd);
}

/**
 * Trục 2: Chuyển động (Motion)
 * Điều khiển Framer Motion <MotionConfig reducedMotion="always" | "user">.
 */
export function resolveMotionReduced(
  mode: PerformanceMode,
  inspection: HardwareInspectionResult = inspectHardware()
): boolean {
  if (mode === 'lite') return true;
  if (mode === 'full') return false;
  const resolved = inspection || inspectHardware();
  return Boolean(resolved.prefersReducedMotion);
}

/**
 * Wrapper tương thích ngược cho code cũ và test suite hiện tại.
 * @deprecated Sử dụng resolveFidelityLite hoặc resolveMotionReduced theo từng trục.
 */
export function resolveEffectiveLiteMode(
  mode: PerformanceMode,
  inspection: HardwareInspectionResult = inspectHardware()
): boolean {
  return resolveFidelityLite(mode, inspection) || resolveMotionReduced(mode, inspection);
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
