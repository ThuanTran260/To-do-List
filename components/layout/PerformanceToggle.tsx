'use client';

import { usePerformance } from '@/providers/PerformanceProvider';
import { Gauge, Zap, Sparkles } from 'lucide-react';

export function PerformanceToggle() {
  const { mode, isLiteActive, cycleMode, inspection } = usePerformance();

  const getTooltip = () => {
    if (mode === 'auto') {
      return `Hiệu năng: Tự động (${
        isLiteActive
          ? 'Đang bật Lite Mode do phát hiện ' + (inspection.isSoftwareRasterizer ? 'máy ảo' : 'máy yếu')
          : 'Đồ họa đầy đủ'
      }). Bấm để đổi.`;
    }
    if (mode === 'lite') {
      return 'Hiệu năng: Luôn bật Lite Mode (Tối ưu mượt mà, tắt blur & animation). Bấm để đổi.';
    }
    return 'Hiệu năng: Luôn bật Đồ họa đầy đủ (Bật toàn bộ blur & motion). Bấm để đổi.';
  };

  return (
    <button
      type="button"
      onClick={cycleMode}
      className={`p-1.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
        isLiteActive
          ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'
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
        <Gauge className={`w-3.5 h-3.5 ${isLiteActive ? 'text-warning' : 'text-ink-subtle'}`} />
      )}
      <span className="hidden md:inline text-[11px]">
        {mode === 'auto' ? (isLiteActive ? 'Lite (Auto)' : 'Auto') : mode === 'lite' ? 'Lite' : 'Full'}
      </span>
    </button>
  );
}
