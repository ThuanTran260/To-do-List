'use client';

import { useState, useRef } from 'react';
import { Palette, Check } from 'lucide-react';
import { NOTE_COLORS, NoteColorConfig } from '@/lib/noteColors';
import { NoteColor } from '@/types/note';
import { PortalPopover } from '@/components/ui/PortalPopover';

interface NoteColorPickerProps {
  selectedColor: NoteColor;
  onChange: (color: NoteColor) => void;
  className?: string;
}

export function NoteColorPicker({
  selectedColor = 'default',
  onChange,
  className = '',
}: NoteColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const colorsList: NoteColorConfig[] = Object.values(NOTE_COLORS);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        title="Đổi màu thẻ ghi chú"
        className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer flex items-center justify-center"
      >
        <Palette className="w-4 h-4" />
      </button>

      <PortalPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        align="end"
      >
        <div className="p-2 w-48 bg-surface-1 border border-hairline rounded-lg shadow-xl text-ink">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle px-1.5 py-1 mb-1 border-b border-hairline">
            Màu nền ghi chú
          </div>
        <div className="grid grid-cols-1 gap-1">
          {colorsList.map((c) => {
            const isSelected = selectedColor === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(c.id);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                  isSelected ? 'bg-surface-3 font-semibold text-ink' : 'hover:bg-surface-2 text-ink-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-hairline shadow-2xs shrink-0"
                    style={{ backgroundColor: c.dotColor }}
                  />
                  <span>{c.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
        </div>
      </PortalPopover>
    </div>
  );
}
