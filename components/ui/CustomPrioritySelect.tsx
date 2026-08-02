'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import { ChevronDown, Check, AlertOctagon, Flame, ShieldCheck } from 'lucide-react';

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
    badgeBg: 'bg-rose-500/10 dark:bg-rose-950/60',
    badgeText: 'text-rose-600 dark:text-rose-400 font-black',
    badgeBorder: 'border-rose-300 dark:border-rose-700',
  },
  {
    id: 'medium',
    label: 'Trung bình (Medium)',
    sublabel: 'Ưu tiên bình thường',
    icon: AlertOctagon,
    badgeBg: 'bg-amber-500/10 dark:bg-amber-950/60',
    badgeText: 'text-amber-600 dark:text-amber-400 font-extrabold',
    badgeBorder: 'border-amber-300 dark:border-amber-700',
  },
  {
    id: 'low',
    label: 'Thấp (Low)',
    sublabel: 'Có thể làm sau',
    icon: ShieldCheck,
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-600 dark:text-emerald-400 font-bold',
    badgeBorder: 'border-emerald-300 dark:border-emerald-700',
  },
];

export function CustomPrioritySelect({ value, onChange }: CustomPrioritySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOpt = PRIORITY_OPTIONS.find((o) => o.id === value) || PRIORITY_OPTIONS[1];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const Icon = selectedOpt.icon;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Custom Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between shadow-2xs active:scale-[0.99] cursor-pointer ${
          isOpen
            ? 'bg-indigo-50/80 dark:bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/20'
            : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <span
            className={`px-2 py-0.5 rounded-lg text-[11px] border flex items-center gap-1.5 ${selectedOpt.badgeBg} ${selectedOpt.badgeText} ${selectedOpt.badgeBorder}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{selectedOpt.label}</span>
          </span>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springPillMotion}
          className="text-slate-400"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Smooth Motion UI Animated Popover List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={springPillMotion}
            className="absolute left-0 right-0 top-full z-50 p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl space-y-1"
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
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`p-1.5 rounded-lg border ${opt.badgeBg} ${opt.badgeText} ${opt.badgeBorder}`}
                    >
                      <OptIcon className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-extrabold truncate">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate">
                        {opt.sublabel}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="p-1 rounded-lg bg-indigo-600 text-white shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
