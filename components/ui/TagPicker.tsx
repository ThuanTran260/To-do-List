'use client';

import { useState, useRef } from 'react';
import { Tag as TagIcon } from 'lucide-react';
import { PortalPopover } from '@/components/ui/PortalPopover';
import { TagPopoverContent } from '@/components/ui/TagPopoverContent';

interface TagPickerProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ selectedTagIds, onChange }: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-hairline bg-surface-2 text-ink-muted hover:text-ink text-xs font-medium transition-colors cursor-pointer"
      >
        <TagIcon className="w-3.5 h-3.5 text-primary" />
        <span>{selectedTagIds.length > 0 ? `${selectedTagIds.length} thẻ` : 'Thêm thẻ'}</span>
      </button>

      <PortalPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={buttonRef}
        maxPopoverHeight={360}
        align="start"
        className="!p-0 !space-y-0 w-72"
      >
        <TagPopoverContent
          selectedTagIds={selectedTagIds}
          onChange={onChange}
          onClose={() => setIsOpen(false)}
          showExistingTagsList={true}
        />
      </PortalPopover>
    </div>
  );
}
