'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Check, Folder } from 'lucide-react';
import { toast } from 'sonner';
import { TagData, useTags, useCreateTag } from '@/hooks/useTags';
import { useCategories } from '@/hooks/useCategories';
import { tagSchema } from '@/lib/validations/tag';
import { sanitizeInput } from '@/lib/sanitize';
import { TAG_PRESET_COLORS, getTagTint, normalizeHexColor } from '@/lib/tags/tagColor';

export interface TagPopoverContentProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  onClose: () => void;
  showExistingTagsList?: boolean; // false for TagBar, true for TagPicker
}

export function TagPopoverContent({
  selectedTagIds,
  onChange,
  onClose,
  showExistingTagsList = false,
}: TagPopoverContentProps) {
  const { data: tags = [] } = useTags();
  const { data: categories = [] } = useCategories();
  const createTag = useCreateTag();

  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_PRESET_COLORS[0]);

  // Stable ref for onClose to prevent listener thrashing across re-renders
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((t) => t !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  const handleCreateTag = async (nameOverride?: string, colorOverride?: string) => {
    const rawTarget = nameOverride || newTagName;
    const cleanName = sanitizeInput(rawTarget).trim().slice(0, 50);
    const colorCandidate = colorOverride || selectedColor;

    if (!cleanName) {
      if (!nameOverride && !newTagName.trim()) return;
      toast.error('Tên thẻ không được để trống');
      return;
    }

    const validation = tagSchema.safeParse({
      name: cleanName,
      color: colorCandidate,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || 'Tên thẻ không hợp lệ');
      return;
    }

    const validated = validation.data;

    // Check existing tags (case-insensitive on sanitized name)
    const existing = tags.find((t) => t.name.toLowerCase() === validated.name.toLowerCase());
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        onChange([...selectedTagIds, existing.id]);
      }
      setNewTagName('');
      if (!showExistingTagsList) {
        onClose();
      }
      return;
    }

    try {
      const tag = await createTag.mutateAsync({
        name: validated.name,
        color: validated.color,
      });
      if (tag && !selectedTagIds.includes(tag.id)) {
        onChange([...selectedTagIds, tag.id]);
      }
      setNewTagName('');
      if (!showExistingTagsList) {
        onClose();
      }
      toast.success(`Đã tạo thẻ "${validated.name}"`);
    } catch {
      toast.error('Lỗi khi tạo thẻ mới');
    }
  };

  return (
    <div
      className="w-72 max-w-full p-3 flex flex-col gap-2.5 max-h-[min(380px,80vh)] overflow-y-auto no-scrollbar"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink">
          {showExistingTagsList ? 'Chọn hoặc tạo thẻ' : 'Tạo hoặc gắn thẻ'}
        </span>
        <span className="text-[10px] text-ink-subtle">{tags.length} thẻ hiện có</span>
      </div>

      {/* Existing tags list for picker mode */}
      {showExistingTagsList && tags.length > 0 && (
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
        </div>
      )}

      {/* Input to create brand new tag */}
      <div
        className={`flex flex-col gap-2 ${
          showExistingTagsList && tags.length > 0 ? 'pt-2 border-t border-hairline' : ''
        }`}
      >
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
            placeholder={showExistingTagsList ? 'Tạo thẻ mới...' : 'Tên thẻ mới...'}
            maxLength={50}
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
          {TAG_PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              className={`w-3.5 h-3.5 rounded-full border transition-transform cursor-pointer ${
                selectedColor.toLowerCase() === c.toLowerCase()
                  ? 'scale-125 border-ink ring-1 ring-ink/30'
                  : 'border-transparent hover:scale-110'
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
            <Folder className="w-3 h-3 text-primary flex-shrink-0" />
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
                  onClick={() => handleCreateTag(cat.name, cat.color)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-primary-border bg-primary-subtle text-primary'
                      : 'border-hairline bg-surface-2 text-ink-muted hover:text-ink'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: normalizeHexColor(cat.color) }}
                  />
                  <span className="truncate max-w-[120px]">{cat.name}</span>
                  {isSelected ? (
                    <Check className="w-3 h-3 text-primary flex-shrink-0" />
                  ) : (
                    <Plus className="w-3 h-3 text-ink-subtle flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
