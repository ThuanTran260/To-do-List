'use client';

import { usePerformance } from '@/providers/PerformanceProvider';
import { Gauge, Zap, Sparkles } from 'lucide-react';

export function PerformanceToggle() {
  const { mode, isFidelityLite, isMotionReduced, cycleMode, inspection } = usePerformance();

  const getAutoReason = () => {
    if (inspection.isSoftwareRasterizer) return 'máy ảo / đồ họa phần mềm';
    if (inspection.cores <= 2) return 'thiết bị cấu hình tiết kiệm';
    return 'tối ưu phần cứng';
  };

  const getTooltip = () => {
    if (mode === 'auto') {
      if (!isFidelityLite && !isMotionReduced) {
        return 'Hiệu năng: Tự động (Đồ họa đầy đủ). Bấm để đổi.';
      }
      if (!isFidelityLite && isMotionReduced) {
        return 'Hiệu năng: Tự động (Đồ họa đầy đủ, đã bật chế độ giảm chuyển động theo cài đặt hệ điều hành). Bấm để đổi.';
      }
      return `Hiệu năng: Tự động (Đang bật Chế độ Tiết kiệm tài nguyên do ${getAutoReason()}). Bấm để đổi.`;
    }
    if (mode === 'lite') {
      return 'Hiệu năng: Luôn bật Lite Mode (Chế độ Tiết kiệm tài nguyên, tắt blur & animation). Bấm để đổi.';
    }
    return 'Hiệu năng: Luôn bật Đồ họa đầy đủ (Bật toàn bộ blur & motion). Bấm để đổi.';
  };

  return (
    <button
      type="button"
      onClick={cycleMode}
      className={`p-1.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
        isFidelityLite
          ? 'bg-warning-subtle text-warning border-warning-border hover:bg-warning/20'
          : 'bg-surface-2 text-ink-muted hover:text-ink border-hairline'
      }`}
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      {mode === 'lite' ? (
        <Zap className="w-3.5 h-3.5 text-warning fill-warning/20" />
      ) : mode === 'full' ? (
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      ) : (
        <Gauge className={`w-3.5 h-3.5 ${isFidelityLite ? 'text-warning' : 'text-ink-subtle'}`} />
      )}
      <span className="hidden md:inline text-[11px]">
        {mode === 'auto' ? (isFidelityLite ? 'Lite (Auto)' : 'Auto') : mode === 'lite' ? 'Lite' : 'Full'}
      </span>
    </button>
  );
}
