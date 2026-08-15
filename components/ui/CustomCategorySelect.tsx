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
        className={`w-full px-3 py-2 rounded-md text-xs font-medium border transition-colors flex items-center justify-between shadow-2xs active:scale-[0.99] cursor-pointer ${
          isOpen
            ? 'bg-surface-2 border-primary-border ring-2 ring-primary/20'
            : 'bg-surface-2 border-hairline text-ink hover:border-hairline-strong'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedCategory ? (
            <span className="flex items-center gap-2 font-medium text-ink truncate">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedCategory.color || '#5e6ad2' }}
              />
              <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="truncate">{selectedCategory.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-ink-subtle font-normal truncate">
              <FolderKanban className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" />
              <span className="truncate">Chưa chọn danh mục</span>
            </span>
          )}
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
            className={`w-full text-left p-2 rounded-md text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
              !value
                ? 'bg-primary-subtle text-primary border border-primary-border'
                : 'hover:bg-surface-2 text-ink-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="w-3.5 h-3.5 text-ink-subtle" />
              <span>Chưa chọn danh mục</span>
            </div>
            {!value && (
              <span className="p-0.5 rounded bg-primary text-on-primary">
                <Check className="w-3 h-3" />
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
                className={`w-full text-left p-2 rounded-md text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-primary-subtle text-primary border border-primary-border'
                    : 'hover:bg-surface-2 text-ink'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color || '#5e6ad2' }}
                  />
                  <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">{cat.name}</span>
                </div>

                {isSelected && (
                  <span className="p-0.5 rounded bg-primary text-on-primary">
                    <Check className="w-3 h-3" />
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
