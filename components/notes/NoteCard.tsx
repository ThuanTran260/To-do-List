'use client';

import { useState } from 'react';
import { Pin, Trash2, Copy } from 'lucide-react';
import { NoteColorPicker } from './NoteColorPicker';
import { useTogglePinNote, useChangeNoteColor, useSoftDeleteNote, useCreateNote } from '@/hooks/useNotes';
import { getNoteColorClasses } from '@/lib/noteColors';
import { extractPlainText } from '@/lib/textHighlight';
import { Note, NoteColor } from '@/types/note';
import { toast } from 'sonner';

interface NoteCardProps {
  note: Note;
  onSelect: (note: Note) => void;
  viewMode?: 'grid' | 'list';
}

export function NoteCard({ note, onSelect, viewMode = 'grid' }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const togglePinMutation = useTogglePinNote();
  const changeColorMutation = useChangeNoteColor();
  const softDeleteMutation = useSoftDeleteNote();
  const createNoteMutation = useCreateNote();

  const colorClass = getNoteColorClasses(note.color);
  const plainText = extractPlainText(note.content);

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePinMutation.mutate({ id: note.id, is_pinned: !note.is_pinned });
  };

  const handleChangeColor = (newColor: NoteColor) => {
    changeColorMutation.mutate({ id: note.id, color: newColor });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    softDeleteMutation.mutate(note.id, {
      onSuccess: () => {
        toast.success('Đã chuyển ghi chú vào Thùng rác', {
          action: {
            label: 'Hoàn tác',
            onClick: () => {
              // restore mutation handled in hooks
            },
          },
        });
      },
    });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    createNoteMutation.mutate({
      title: `${note.title} (Bản sao)`,
      content: note.content,
      color: note.color,
      is_pinned: false,
    });
    toast.success('Đã nhân bản ghi chú');
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onSelect(note)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-sm ${colorClass}`}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            {note.is_pinned && (
              <Pin className="w-3.5 h-3.5 text-primary fill-current shrink-0" />
            )}
            <h3 className="font-semibold text-sm text-ink truncate">
              {note.title || 'Ghi chú không có tiêu đề'}
            </h3>
          </div>
          {plainText && (
            <p className="text-xs text-ink-muted line-clamp-1">
              {plainText}
            </p>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <NoteColorPicker selectedColor={note.color} onChange={handleChangeColor} />

          <button
            type="button"
            onClick={handleTogglePin}
            title={note.is_pinned ? 'Bỏ ghim' : 'Ghim'}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              note.is_pinned
                ? 'text-primary bg-primary-subtle'
                : 'text-ink-muted hover:text-ink hover:bg-surface-2'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            title="Xóa vào thùng rác"
            className="p-1.5 rounded-md text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(note)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 min-h-[160px] ${colorClass}`}
    >
      <div>
        {/* Card Header: Title & Pin button */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm text-ink line-clamp-2">
            {note.title || 'Ghi chú không có tiêu đề'}
          </h3>

          <button
            type="button"
            onClick={handleTogglePin}
            title={note.is_pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              note.is_pinned
                ? 'text-primary bg-primary-subtle opacity-100'
                : 'text-ink-muted hover:text-ink hover:bg-surface-2 opacity-0 group-hover:opacity-100'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Card Body snippet */}
        {plainText ? (
          <p className="text-xs text-ink-muted line-clamp-5 whitespace-pre-line leading-relaxed">
            {plainText}
          </p>
        ) : (
          <span className="text-xs text-ink-subtle italic">Chưa có nội dung...</span>
        )}
      </div>

      {/* Card Footer: Tags & Quick Action Toolbar */}
      <div className="pt-3 mt-2 border-t border-hairline/40 flex items-center justify-between">
        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          {note.tags && note.tags.length > 0 ? (
            note.tags.slice(0, 2).map((t) => (
              <span
                key={t.id}
                className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2/80 text-ink-subtle font-medium border border-hairline"
              >
                #{t.name}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-ink-subtle">
              {new Date(note.updated_at).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>

        {/* Hover Action buttons */}
        <div
          className={`flex items-center gap-0.5 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <NoteColorPicker selectedColor={note.color} onChange={handleChangeColor} />

          <button
            type="button"
            onClick={handleDuplicate}
            title="Nhân bản ghi chú"
            className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            title="Xóa vào thùng rác"
            className="p-1.5 rounded-md text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
