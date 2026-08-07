'use client';

import { useState } from 'react';
import { TagData, useTags, useCreateTag } from '@/hooks/useTags';
import { Tag as TagIcon, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TagPickerProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

const PRESET_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

export function TagPicker({ selectedTagIds, onChange }: TagPickerProps) {
  const { data: tags = [] } = useTags();
  const createTag = useCreateTag();
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter(t => t !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      const tag = await createTag.mutateAsync({ name: newTagName, color: selectedColor });
      onChange([...selectedTagIds, tag.id]);
      setNewTagName('');
      toast.success('Đã tạo thẻ mới');
    } catch {
      toast.error('Lỗi khi tạo thẻ mới');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white text-xs transition-colors"
      >
        <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
        <span>{selectedTagIds.length > 0 ? `${selectedTagIds.length} thẻ` : 'Thêm thẻ'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-slate-400">Chọn thẻ</div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {tags.map((tag: TagData) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isSelected ? 'border-transparent text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                  style={{ backgroundColor: isSelected ? `${tag.color}33` : undefined, borderColor: isSelected ? tag.color : undefined }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span>{tag.name}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5 text-white" />}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleCreateTag} className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                placeholder="Tạo thẻ mới..."
                className="flex-1 px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newTagName.trim() || createTag.isPending}
                className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-4 h-4 rounded-full border transition-transform ${selectedColor === c ? 'scale-125 border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
