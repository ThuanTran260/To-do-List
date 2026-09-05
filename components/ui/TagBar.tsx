'use client';

import { useState, useRef, useEffect } from 'react';
import { TagData, useTags, useCreateTag } from '@/hooks/useTags';
import { useCategories } from '@/hooks/useCategories';
import { Plus, Check, Folder } from 'lucide-react';
import { toast } from 'sonner';

interface TagBarProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

const PRESET_COLORS = ['#5e6ad2', '#f2555a', '#27a644', '#f59e0b', '#3b82f6', '#8b5cf6'];

export function TagBar({ selectedTagIds, onChange }: TagBarProps) {
  const { data: tags = [], isLoading } = useTags();
  const { data: categories = [] } = useCategories();
  const createTag = useCreateTag();

  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#5e6ad2');
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click outside listener to close popover
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((t) => t !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  const handleCreateTag = async (e?: React.FormEvent, nameOverride?: string, colorOverride?: string) => {
    if (e) e.preventDefault();
    const tagName = (nameOverride || newTagName).trim();
    const tagColor = colorOverride || selectedColor;

    if (!tagName) return;

    const existing = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        onChange([...selectedTagIds, existing.id]);
      }
      setNewTagName('');
      setIsOpen(false);
      return;
    }

    try {
      const tag = await createTag.mutateAsync({ name: tagName, color: tagColor });
      onChange([...selectedTagIds, tag.id]);
      setNewTagName('');
      setIsOpen(false);
      toast.success(`Đã tạo thẻ "${tagName}"`);
    } catch {
      toast.error('Lỗi khi tạo thẻ mới');
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
                    backgroundColor: isSelected ? `${tag.color}22` : undefined,
                    borderColor: isSelected ? tag.color : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
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

      {/* Popover Form to create or quick-add tags */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-1.5 w-72 p-3 bg-surface-1 border border-hairline rounded-xl shadow-xl z-30 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Tạo hoặc gắn thẻ</span>
            <span className="text-[10px] text-ink-subtle">{tags.length} thẻ hiện có</span>
          </div>

          {/* Input to create brand new tag */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCreateTag();
                  }
                }}
                placeholder="Tên thẻ mới..."
                autoFocus
                className="flex-1 px-2.5 py-1 text-xs bg-surface-2 border border-hairline rounded-md text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border"
              />
              <button
                type="button"
                onClick={() => handleCreateTag()}
                disabled={!newTagName.trim() || createTag.isPending}
                className="p-1 rounded-md bg-primary hover:bg-primary-hover text-on-primary disabled:opacity-50 cursor-pointer transition-colors"
                title="Tạo thẻ"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Color presets selector */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-ink-subtle mr-1">Màu:</span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-3.5 h-3.5 rounded-full border transition-transform cursor-pointer ${
                    selectedColor === c ? 'scale-125 border-ink' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Quick convert from categories */}
          {categories.length > 0 && (
            <div className="pt-2 border-t border-hairline space-y-1.5">
              <div className="text-[11px] font-medium text-ink-subtle flex items-center gap-1">
                <Folder className="w-3 h-3 text-primary" />
                <span>Thêm nhanh từ Danh mục:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const tagMatch = tags.find((t) => t.name.toLowerCase() === cat.name.toLowerCase());
                  const isSelected = tagMatch ? selectedTagIds.includes(tagMatch.id) : false;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCreateTag(undefined, cat.name, cat.color)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-primary-border bg-primary-subtle text-primary'
                          : 'border-hairline bg-surface-2 text-ink-muted hover:text-ink'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                      {isSelected ? <Check className="w-3 h-3 text-primary" /> : <Plus className="w-3 h-3 text-ink-subtle" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
