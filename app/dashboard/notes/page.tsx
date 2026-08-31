'use client';

import { useState, useMemo, useCallback } from 'react';
import { StickyNote, Pin, Plus, Search, Sparkles } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { NoteModal } from '@/components/notes/NoteModal';
import { NoteTrashModal } from '@/components/notes/NoteTrashModal';
import { NoteFilterBar } from '@/components/notes/NoteFilterBar';
import { normalizeSearchText, extractPlainText } from '@/lib/textHighlight';
import { Note } from '@/types/note';

const EMPTY_NOTES: Note[] = [];

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const handleCloseNew = useCallback(() => {
    setIsCreatingNew(false);
  }, []);

  const handleNoteCreated = useCallback((_newNote: Note) => {
    // Note created successfully
  }, []);

  const { data, isLoading } = useNotes({
    tagId: selectedTag,
    color: selectedColor,
  });

  const allNotes = data?.notes ?? EMPTY_NOTES;

  // Filter notes in memory by search query using Vietnamese unaccent matching
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return allNotes;
    const normalizedQuery = normalizeSearchText(searchQuery);

    return allNotes.filter((note) => {
      const matchTitle = normalizeSearchText(note.title).includes(normalizedQuery);
      const matchContent = normalizeSearchText(extractPlainText(note.content)).includes(
        normalizedQuery
      );
      const matchTags = note.tags?.some((t) =>
        normalizeSearchText(t.name).includes(normalizedQuery)
      );
      return matchTitle || matchContent || matchTags;
    });
  }, [allNotes, searchQuery]);

  const pinnedNotes = useMemo(
    () => filteredNotes.filter((n) => n.is_pinned),
    [filteredNotes]
  );
  const otherNotes = useMemo(
    () => filteredNotes.filter((n) => !n.is_pinned),
    [filteredNotes]
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-subtle text-primary border border-primary-border shadow-2xs">
            <StickyNote className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Ghi chú & Ý tưởng
            </h1>
            <p className="text-xs text-ink-subtle">
              Không gian lưu trữ, đánh dấu highlight và tổ chức ý tưởng mượt mà
            </p>
          </div>
        </div>
      </div>

      {/* Quick Note Create Box */}
      <div className="max-w-2xl mx-auto">
        {isCreatingNew ? (
          <NoteEditor
            onClose={handleCloseNew}
            onNoteCreated={handleNoteCreated}
          />
        ) : (
          <div
            onClick={() => setIsCreatingNew(true)}
            className="p-3.5 bg-surface-1 hover:bg-surface-2 border border-hairline rounded-xl shadow-xs flex items-center justify-between cursor-pointer transition-all duration-150 text-ink-subtle hover:text-ink group"
          >
            <span className="text-xs sm:text-sm font-medium">
              Tạo ghi chú mới (gõ ý tưởng, checklist, highlight)...
            </span>
            <div className="p-1.5 rounded-lg bg-surface-2 group-hover:bg-primary group-hover:text-on-primary text-ink-muted transition-colors">
              <Plus className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar (Search, Tag, Color, View Mode, Trash) */}
      <NoteFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenTrash={() => setIsTrashOpen(true)}
      />

      {/* Notes Content Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-36 rounded-xl bg-surface-1 border border-hairline animate-pulse p-4"
            />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-surface-1/50 border border-hairline rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-primary-subtle text-primary border border-primary-border mx-auto flex items-center justify-center">
            {searchQuery ? <Search className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <h3 className="text-sm font-semibold text-ink">
            {searchQuery
              ? `Không tìm thấy ghi chú nào khớp với "${searchQuery}"`
              : 'Chưa có ghi chú nào'}
          </h3>
          <p className="text-xs text-ink-subtle max-w-sm mx-auto">
            {searchQuery
              ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh sách.'
              : 'Nhấn vào ô tạo ghi chú phía trên hoặc phím tắt N để bắt đầu ghi lại ý tưởng đầu tiên của bạn.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsCreatingNew(true)}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo ghi chú đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-subtle px-1">
                <Pin className="w-3.5 h-3.5 text-primary fill-current" />
                <span>Đã ghim ({pinnedNotes.length})</span>
              </div>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-2'
                }
              >
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onSelect={setSelectedNote}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes Section */}
          {otherNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-subtle px-1 pt-2">
                  Khác ({otherNotes.length})
                </div>
              )}
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-2'
                }
              >
                {otherNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onSelect={setSelectedNote}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expanded Modal for editing selected note */}
      <NoteModal
        note={selectedNote}
        isOpen={Boolean(selectedNote)}
        onClose={() => setSelectedNote(null)}
      />

      {/* Trash Modal */}
      <NoteTrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
      />
    </div>
  );
}
