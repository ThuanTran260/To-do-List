'use client';

import { useState } from 'react';
import { TagData, useTags, useCreateTag } from '@/hooks/useTags';
import { useCategories } from '@/hooks/useCategories';
import { Tag as TagIcon, Plus, Check, Folder } from 'lucide-react';
import { toast } from 'sonner';

interface TagPickerProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

const PRESET_COLORS = ['#5e6ad2', '#f2555a', '#27a644', '#f59e0b', '#3b82f6', '#8b5cf6'];

export function TagPicker({ selectedTagIds, onChange }: TagPickerProps) {
  const { data: tags = [] } = useTags();
  const { data: categories = [] } = useCategories();
  const createTag = useCreateTag();

  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#5e6ad2');

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
      return;
    }

    try {
      const tag = await createTag.mutateAsync({ name: tagName, color: tagColor });
      onChange([...selectedTagIds, tag.id]);
      setNewTagName('');
      toast.success(`Đã tạo thẻ "${tagName}"`);
    } catch {
      toast.error('Lỗi khi tạo thẻ mới');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-hairline bg-surface-2 text-ink-muted hover:text-ink text-xs font-medium transition-colors cursor-pointer"
      >
        <TagIcon className="w-3.5 h-3.5 text-primary" />
        <span>{selectedTagIds.length > 0 ? `${selectedTagIds.length} thẻ` : 'Thêm thẻ'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 p-3 bg-surface-1 border border-hairline rounded-xl shadow-xl z-50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Chọn hoặc tạo thẻ</span>
            <span className="text-[10px] text-ink-subtle">{tags.length} thẻ hiện có</span>
          </div>

          {/* List of existing custom tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {tags.map((tag: TagData) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-transparent text-ink font-semibold'
                        : 'border-hairline text-ink-muted hover:border-hairline-strong'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${tag.color}22` : undefined,
                      borderColor: isSelected ? tag.color : undefined,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span>{tag.name}</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick convert from categories */}
          {categories.length > 0 && (
            <div className="pt-2 border-t border-hairline space-y-1.5">
              <div className="text-[11px] font-medium text-ink-subtle flex items-center gap-1">
                <Folder className="w-3 h-3 text-primary" />
                <span>Thêm nhanh từ Danh mục:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
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

          {/* Input to create brand new tag */}
          <div className="pt-2 border-t border-hairline flex flex-col gap-2">
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
                placeholder="Tạo thẻ mới..."
                className="flex-1 px-2.5 py-1 text-xs bg-surface-2 border border-hairline rounded-md text-ink placeholder:text-ink-subtle focus:outline-none focus:border-primary-border"
              />
              <button
                type="button"
                onClick={() => handleCreateTag()}
                disabled={!newTagName.trim() || createTag.isPending}
                className="p-1 rounded-md bg-primary hover:bg-primary-hover text-on-primary disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-3.5 h-3.5 rounded-full border transition-transform cursor-pointer ${
                    selectedColor === c ? 'scale-125 border-ink' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
