'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import { ChevronDown, Check, AlertOctagon, Flame, ShieldCheck } from 'lucide-react';
import { PortalPopover } from '@/components/ui/PortalPopover';

export type PriorityType = 'low' | 'medium' | 'high';

interface CustomPrioritySelectProps {
  value: PriorityType;
  onChange: (val: PriorityType) => void;
}

const PRIORITY_OPTIONS: {
  id: PriorityType;
  label: string;
  sublabel: string;
  icon: typeof AlertOctagon;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}[] = [
  {
    id: 'high',
    label: 'Cao (High)',
    sublabel: 'Cần làm gấp, ghim ưu tiên',
    icon: Flame,
    badgeBg: 'bg-danger/10',
    badgeText: 'text-danger font-semibold',
    badgeBorder: 'border-danger/25',
  },
  {
    id: 'medium',
    label: 'Trung bình (Medium)',
    sublabel: 'Ưu tiên bình thường',
    icon: AlertOctagon,
    badgeBg: 'bg-warning/10',
    badgeText: 'text-warning font-semibold',
    badgeBorder: 'border-warning/25',
  },
  {
    id: 'low',
    label: 'Thấp (Low)',
    sublabel: 'Có thể làm sau',
    icon: ShieldCheck,
    badgeBg: 'bg-success/10',
    badgeText: 'text-success font-medium',
    badgeBorder: 'border-success/25',
  },
];

export function CustomPrioritySelect({ value, onChange }: CustomPrioritySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOpt = PRIORITY_OPTIONS.find((o) => o.id === value) || PRIORITY_OPTIONS[1];
  const Icon = selectedOpt.icon;

  return (
    <div className="w-full">
      {/* Custom Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 rounded-md text-xs font-medium border transition-colors flex items-center justify-between shadow-2xs active:scale-[0.99] cursor-pointer ${
          isOpen
            ? 'bg-surface-2 border-primary-border ring-2 ring-primary/20'
            : 'bg-surface-2 border-hairline text-ink hover:border-hairline-strong'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className={`px-2 py-0.5 rounded text-[11px] border flex items-center gap-1.5 ${selectedOpt.badgeBg} ${selectedOpt.badgeText} ${selectedOpt.badgeBorder}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{selectedOpt.label}</span>
          </span>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springPillMotion}
          className="text-ink-subtle"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </button>

      {/* Render via PortalPopover to escape parent stacking contexts & overflow-y-auto clipping */}
      <PortalPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        maxPopoverHeight={220}
      >
        {PRIORITY_OPTIONS.map((opt) => {
          const isSelected = opt.id === value;
          const OptIcon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(opt.id);
                setIsOpen(false);
              }}
              className={`w-full text-left p-2 rounded-md text-xs font-medium transition-colors flex items-center justify-between group cursor-pointer ${
                isSelected
                  ? 'bg-primary-subtle text-primary border border-primary-border'
                  : 'hover:bg-surface-2 text-ink'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`p-1 rounded border ${opt.badgeBg} ${opt.badgeText} ${opt.badgeBorder}`}
                >
                  <OptIcon className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{opt.label}</div>
                  <div className="text-[10px] text-ink-subtle font-normal truncate">
                    {opt.sublabel}
                  </div>
                </div>
              </div>

              {isSelected && (
                <span className="p-0.5 rounded bg-primary text-on-primary">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </PortalPopover>
    </div>
  );
}
