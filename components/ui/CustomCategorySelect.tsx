'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import { ChevronDown, Check, FolderKanban, Folder } from 'lucide-react';
import type { CategoryItemData } from '@/hooks/useCategories';
import { PortalPopover } from '@/components/ui/PortalPopover';

interface CustomCategorySelectProps {
  categories: CategoryItemData[];
  value: string; // category_id
  onChange: (categoryId: string) => void;
}

export function CustomCategorySelect({
  categories,
  value,
  onChange,
}: CustomCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedCategory = categories.find((c) => c.id === value);

  return (
    <div className="w-full">
      {/* Custom Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between shadow-2xs active:scale-[0.99] cursor-pointer ${
          isOpen
            ? 'bg-indigo-50/80 dark:bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/20'
            : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedCategory ? (
            <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedCategory.color || '#6366f1' }}
              />
              <Folder className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className="truncate">{selectedCategory.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-slate-400 font-semibold truncate">
              <FolderKanban className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">Chưa chọn danh mục</span>
            </span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springPillMotion}
          className="text-slate-400"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Render via PortalPopover to escape parent stacking contexts & overflow-y-auto clipping */}
      <PortalPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        maxPopoverHeight={240}
      >
        <div className="max-h-56 overflow-y-auto space-y-1 no-scrollbar">
          {/* Option: None (Chưa chọn danh mục) */}
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
              !value
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-slate-400" />
              <span>Chưa chọn danh mục</span>
            </div>
            {!value && (
              <span className="p-1 rounded-lg bg-indigo-600 text-white shadow-xs">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </button>

          {/* List Categories */}
          {categories.map((cat) => {
            const isSelected = cat.id === value;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color || '#6366f1' }}
                  />
                  <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="truncate">{cat.name}</span>
                </div>

                {isSelected && (
                  <span className="p-1 rounded-lg bg-indigo-600 text-white shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PortalPopover>
    </div>
  );
}
