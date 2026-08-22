'use client';

import { Search, LayoutGrid, List, Trash2, Tag as TagIcon, X } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import { useTrashNotes } from '@/hooks/useNotes';
import { NOTE_COLORS } from '@/lib/noteColors';
import { NoteColor } from '@/types/note';

interface NoteFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTag: string;
  onTagChange: (tagId: string) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onOpenTrash: () => void;
}

export function NoteFilterBar({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagChange,
  selectedColor,
  onColorChange,
  viewMode,
  onViewModeChange,
  onOpenTrash,
}: NoteFilterBarProps) {
  const { data: tags = [] } = useTags();
  const { data: trashNotes = [] } = useTrashNotes();

  const colorKeys = Object.keys(NOTE_COLORS) as NoteColor[];

  return (
    <div className="space-y-3">
      {/* Top row: Search input, View Switcher & Trash */}
      <div className="flex items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm ghi chú theo tiêu đề hoặc nội dung..."
            className="w-full pl-9 pr-8 py-2 bg-surface-1 border border-hairline rounded-lg text-xs sm:text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-primary transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-ink-subtle hover:text-ink transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right action tools: Grid/List switch & Trash */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* View Mode Toggle */}
          <div className="p-0.5 bg-surface-2 border border-hairline rounded-lg flex items-center">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="Xem dạng lưới"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface-1 text-primary shadow-2xs font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              title="Xem dạng danh sách"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-surface-1 text-primary shadow-2xs font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Trash Button */}
          <button
            type="button"
            onClick={onOpenTrash}
            title="Thùng rác ghi chú"
            className="relative p-2 rounded-lg bg-surface-1 hover:bg-surface-2 border border-hairline text-ink-muted hover:text-danger transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
          >
            <Trash2 className="w-4 h-4" />
            {trashNotes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-on-primary text-[10px] font-bold flex items-center justify-center">
                {trashNotes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom row: Color filters & Tag chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {/* All Colors Filter */}
        <button
          type="button"
          onClick={() => onColorChange('all')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 font-medium ${
            selectedColor === 'all'
              ? 'bg-primary text-on-primary font-semibold'
              : 'bg-surface-1 hover:bg-surface-2 border border-hairline text-ink-muted'
          }`}
        >
          Tất cả màu
        </button>

        {/* Color Palette pills */}
        {colorKeys.map((cKey) => {
          const cfg = NOTE_COLORS[cKey];
          const isSelected = selectedColor === cKey;
          return (
            <button
              key={cKey}
              type="button"
              onClick={() => onColorChange(isSelected ? 'all' : cKey)}
              title={`Lọc màu ${cfg.label}`}
              className={`px-2 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-surface-2 font-semibold text-ink'
                  : 'border-hairline bg-surface-1 hover:bg-surface-2 text-ink-muted'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cfg.dotColor }}
              />
              <span className="text-[11px]">{cfg.label}</span>
            </button>
          );
        })}

        {/* Tags filter chips */}
        {tags.length > 0 && (
          <>
            <div className="w-px h-4 bg-hairline mx-1 shrink-0" />
            {tags.map((t) => {
              const isSelected = selectedTag === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTagChange(isSelected ? 'all' : t.id)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 flex items-center gap-1 border ${
                    isSelected
                      ? 'bg-primary text-on-primary font-semibold border-primary'
                      : 'bg-surface-1 hover:bg-surface-2 border-hairline text-ink-muted'
                  }`}
                >
                  <TagIcon className="w-3 h-3" />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
