'use client';

import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Pin,
  PinOff,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Heading1,
  Heading2,
  List,
  ListTodo,
  Quote,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { FloatingHighlightToolbar } from './FloatingHighlightToolbar';
import { NoteColorPicker } from './NoteColorPicker';
import { useAutosaveNote } from '@/hooks/useAutosaveNote';
import { sanitizeHtml } from '@/lib/clientSanitize';
import { getNoteColorClasses, HIGHLIGHT_COLORS } from '@/lib/noteColors';
import { Note, NoteColor } from '@/types/note';

interface NoteEditorProps {
  note?: Note | null;
  initialTitle?: string;
  initialContent?: string;
  initialColor?: NoteColor;
  initialPinned?: boolean;
  onNoteCreated?: (newNote: Note) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function NoteEditor({
  note,
  initialTitle = '',
  initialContent = '',
  initialColor = 'default',
  initialPinned = false,
  onNoteCreated,
  onClose,
  isModal = false,
}: NoteEditorProps) {
  const [isExpanded, setIsExpanded] = useState(isModal);
  const currentNoteIdRef = useRef<string | null>(note?.id || null);

  const {
    title,
    color,
    isPinned,
    status,
    hasConflict,
    updateTitle,
    updateContent,
    updateColor,
    updatePinned,
    flush,
    retry,
  } = useAutosaveNote({
    note,
    initialTitle,
    initialContent,
    initialColor,
    initialPinned,
    onNoteCreated,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Highlight.configure({ multicolor: true }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose task-list space-y-1 my-2 p-0 list-none',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex flex-row items-start gap-2.5 my-1 list-none',
        },
      }),
      Placeholder.configure({
        placeholder: 'Ghi chú ý tưởng, danh sách việc, hoặc dán nội dung...',
      }),
    ],
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    // E-H1 read-time sanitize: DB content đi qua TipTap mà không qua DOMPurify
    // sẽ render event-handler nguy hiểm — sanitize trước khi setContent.
    content: sanitizeHtml(initialContent || note?.content || ''),
    editorProps: {
      attributes: {
        class:
          'tiptap-editor prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[140px] px-3 py-2 text-ink text-sm leading-relaxed',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      updateContent(currentEditor.getHTML());
    },
  });

  // Only update editor content when switching to a completely different note
  useEffect(() => {
    if (editor && note?.id && note.id !== currentNoteIdRef.current) {
      currentNoteIdRef.current = note.id;
      editor.commands.setContent(sanitizeHtml(note.content || ''), { emitUpdate: false });
    }
  }, [editor, note?.id, note?.content]);

  // Handle editor-level keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flush();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, flush, onClose]);

  const colorClass = getNoteColorClasses(color);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 shadow-sm flex flex-col ${colorClass} ${
        isExpanded ? 'min-h-[400px]' : ''
      }`}
    >
      {/* Top Header Action Bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1 border-b border-hairline/60 gap-2">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Tiêu đề ghi chú..."
          className="w-full bg-transparent font-semibold text-sm sm:text-base text-ink placeholder:text-ink-subtle focus:outline-none"
        />

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Pin Button */}
          <button
            type="button"
            onClick={() => updatePinned(!isPinned)}
            title={isPinned ? 'Bỏ ghim' : 'Ghim ghi chú lên đầu'}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isPinned
                ? 'text-primary bg-primary-subtle border border-primary-border'
                : 'text-ink-muted hover:text-ink hover:bg-surface-2'
            }`}
          >
            {isPinned ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4" />}
          </button>

          {/* Color Picker with collision-aware alignment */}
          <NoteColorPicker selectedColor={color} onChange={updateColor} />

          {/* Expand/Modal toggle if inline */}
          {!isModal && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
              className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Floating Selection Toolbar for Quick Highlights */}
      <FloatingHighlightToolbar editor={editor} />

      {/* Formatting Toolbar with onMouseDown preventDefault to prevent Focus Stealing */}
      <div className="flex items-center flex-wrap gap-1 px-2 py-1.5 bg-surface-2/40 border-b border-hairline/40 text-ink-muted text-xs">
        {/* Heading 1 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            editor?.isActive('heading', { level: 1 })
              ? 'bg-primary-subtle text-primary border border-primary-border shadow-2xs'
              : 'hover:bg-surface-2 text-ink-muted hover:text-ink'
          }`}
          title="Tiêu đề lớn (Heading 1)"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            editor?.isActive('heading', { level: 2 })
              ? 'bg-primary-subtle text-primary border border-primary-border shadow-2xs'
              : 'hover:bg-surface-2 text-ink-muted hover:text-ink'
          }`}
          title="Tiêu đề phụ (Heading 2)"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-hairline mx-0.5" />

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            editor?.isActive('bulletList')
              ? 'bg-primary-subtle text-primary border border-primary-border shadow-2xs'
              : 'hover:bg-surface-2 text-ink-muted hover:text-ink'
          }`}
          title="Danh sách gạch đầu dòng (Bullet List)"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Task List (Checklist) */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            editor?.isActive('taskList')
              ? 'bg-primary-subtle text-primary border border-primary-border shadow-2xs'
              : 'hover:bg-surface-2 text-ink-muted hover:text-ink'
          }`}
          title="Danh sách việc cần làm (Checklist việc)"
        >
          <ListTodo className="w-4 h-4" />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            editor?.isActive('blockquote')
              ? 'bg-primary-subtle text-primary border border-primary-border shadow-2xs'
              : 'hover:bg-surface-2 text-ink-muted hover:text-ink'
          }`}
          title="Khối trích dẫn (Blockquote)"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-hairline mx-0.5" />

        {/* 6 Quick Highlight Pastel Color Buttons */}
        <div className="flex items-center gap-1 px-1">
          {HIGHLIGHT_COLORS.map((hc) => {
            const isActive = editor?.isActive('highlight', { color: hc.color });
            return (
              <button
                key={hc.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (isActive) {
                    editor?.chain().focus().unsetHighlight().run();
                  } else {
                    editor?.chain().focus().setHighlight({ color: hc.color }).run();
                  }
                }}
                className={`w-4 h-4 rounded-full border transition-all cursor-pointer hover:scale-115 ${
                  isActive ? 'border-primary ring-2 ring-primary/40 scale-110' : 'border-hairline/80'
                }`}
                style={{ backgroundColor: hc.color }}
                title={`Highlight màu ${hc.label}`}
              />
            );
          })}
        </div>

        <div className="w-px h-4 bg-hairline mx-0.5" />

        {/* Undo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          className="p-1.5 rounded-md hover:bg-surface-2 transition-colors disabled:opacity-30 cursor-pointer text-ink-muted"
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          className="p-1.5 rounded-md hover:bg-surface-2 transition-colors disabled:opacity-30 cursor-pointer text-ink-muted"
          title="Làm lại (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Conflict Alert Banner */}
      {hasConflict && (
        <div className="px-3 py-1.5 bg-warning/15 border-t border-warning/30 text-warning text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Ghi chú đã được cập nhật ở thiết bị/tab khác.</span>
          </div>
          <button
            type="button"
            onClick={retry}
            className="underline font-semibold hover:text-warning-hover cursor-pointer"
          >
            Ghi đè
          </button>
        </div>
      )}

      {/* Footer Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-hairline/40 text-xs text-ink-subtle">
        {/* Autosave Status Indicator */}
        <div className="flex items-center gap-1.5">
          {status === 'saving' || status === 'dirty' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-[11px] text-ink-muted">Đang lưu...</span>
            </>
          ) : status === 'error' ? (
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-1 text-[11px] text-danger font-medium hover:underline cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Lưu thất bại — Thử lại</span>
            </button>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span className="text-[11px] text-ink-subtle">Đã lưu</span>
            </>
          )}
        </div>

        {/* Close/Done button */}
        {onClose && (
          <button
            type="button"
            onClick={() => {
              flush();
              onClose();
            }}
            className="px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 text-ink text-xs font-medium transition-colors cursor-pointer"
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}
