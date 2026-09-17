'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import { Sparkles, Check } from 'lucide-react';
import { WheelPickerColumn } from '@/components/ui/WheelPickerColumn';

interface TimeWheelPickerProps {
  hours: string;
  minutes: string;
  onChangeHours: (h: string) => void;
  onChangeMinutes: (m: string) => void;
  onConfirm: () => void;
}

const ITEM_HEIGHT = 36;
const CONTAINER_HEIGHT = 180;
const CENTER_OFFSET = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

export function TimeWheelPicker({
  hours,
  minutes,
  onChangeHours,
  onChangeMinutes,
  onConfirm,
}: TimeWheelPickerProps) {
  const currentHoursInt = parseInt(hours, 10) || 0;
  const currentMinutesInt = parseInt(minutes, 10) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={springPillMotion}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }}
      className="absolute bottom-12 right-0 z-[9999] p-3.5 rounded-xl surface-panel bg-surface-1 border border-hairline shadow-2xl space-y-3 w-72 text-ink select-none touch-none overscroll-contain"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-hairline">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>CHỌN GIỜ</span>
        </span>
        <button
          type="button"
          onClick={onConfirm}
          className="px-2.5 py-1 rounded-md bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium transition-colors shadow-xs active:scale-98 flex items-center gap-1 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Xác nhận</span>
        </button>
      </div>

      {/* Controlled Framer Motion 3D Wheel Container */}
      <div
        className="flex items-center justify-center gap-3 relative overflow-hidden rounded-lg bg-surface-2 p-2 border border-hairline touch-none overscroll-contain"
        style={{ height: `${CONTAINER_HEIGHT}px` }}
      >
        {/* Lens Highlight Center Bar */}
        <div
          style={{
            height: `${ITEM_HEIGHT}px`,
            top: `${CENTER_OFFSET + 8}px`,
          }}
          className="absolute inset-x-3 rounded-md bg-primary-subtle border border-primary-border pointer-events-none z-0"
        />

        {/* Hours Wheel Column */}
        <WheelPickerColumn
          value={currentHoursInt}
          onChange={(val) => onChangeHours(String(val).padStart(2, '0'))}
          min={0}
          max={23}
          loop={true}
          formatLabel={(v) => String(v).padStart(2, '0')}
          ariaLabel="Giờ"
          className="w-28"
        />

        {/* Center Separator Colon */}
        <span className="font-mono text-base font-semibold text-primary z-10 select-none">:</span>

        {/* Minutes Wheel Column */}
        <WheelPickerColumn
          value={currentMinutesInt}
          onChange={(val) => onChangeMinutes(String(val).padStart(2, '0'))}
          min={0}
          max={59}
          loop={true}
          formatLabel={(v) => String(v).padStart(2, '0')}
          ariaLabel="Phút"
          className="w-28"
        />
      </div>
    </motion.div>
  );
}
