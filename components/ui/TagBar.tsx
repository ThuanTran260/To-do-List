'use client';

import { useState, useRef } from 'react';
import { TagData, useTags } from '@/hooks/useTags';
import { Plus, Check } from 'lucide-react';
import { PortalPopover } from '@/components/ui/PortalPopover';
import { TagPopoverContent } from '@/components/ui/TagPopoverContent';
import { getTagTint, normalizeHexColor } from '@/lib/tags/tagColor';

interface TagBarProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagBar({ selectedTagIds, onChange }: TagBarProps) {
  const { data: tags = [], isLoading } = useTags();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((t) => t !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  return (
    <div className="relative flex items-center min-h-[32px] w-full">
      {/* Horizontal Scrollable Tag Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full scroll-smooth">
        {/* + Thẻ Trigger Button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
            isOpen
              ? 'bg-primary-subtle border-primary-border text-primary'
              : 'border-hairline bg-surface-2 text-ink-muted hover:text-ink hover:bg-surface-3'
          }`}
          title="Tạo hoặc chọn thêm thẻ"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>Thẻ</span>
        </button>

        {/* Skeleton loading placeholders (Zero CLS) */}
        {isLoading && tags.length === 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-6 rounded-md bg-surface-2/60 animate-pulse" />
            <div className="w-20 h-6 rounded-md bg-surface-2/60 animate-pulse" />
            <div className="w-14 h-6 rounded-md bg-surface-2/60 animate-pulse" />
          </div>
        )}

        {/* Existing Tags Pills */}
        {!isLoading && tags.length > 0 && (
          <>
            {tags.map((tag: TagData) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-transparent text-ink font-semibold'
                      : 'border-hairline bg-surface-2/70 text-ink-muted hover:text-ink hover:border-hairline-strong'
                  }`}
                  style={{
                    backgroundColor: isSelected ? getTagTint(tag.color, '22') : undefined,
                    borderColor: isSelected ? normalizeHexColor(tag.color) : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: normalizeHexColor(tag.color) }}
                  />
                  <span className="truncate max-w-[130px]">{tag.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </>
        )}

        {/* Subtle empty hint when no tags exist */}
        {!isLoading && tags.length === 0 && (
          <span className="text-[11px] text-ink-subtle italic px-1 select-none">
            Chưa có thẻ nào. Bấm &quot;+ Thẻ&quot; để tạo nhanh.
          </span>
        )}
      </div>

      {/* Portal Popover Form */}
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
          showExistingTagsList={false}
        />
      </PortalPopover>
    </div>
  );
}
