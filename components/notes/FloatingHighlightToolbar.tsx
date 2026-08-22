'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Code, Highlighter } from 'lucide-react';
import { HIGHLIGHT_COLORS } from '@/lib/noteColors';
import { HighlightColor } from '@/types/note';

interface FloatingHighlightToolbarProps {
  editor: Editor | null;
}

export function FloatingHighlightToolbar({ editor }: FloatingHighlightToolbarProps) {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!editor) return;

    const updatePosition = () => {
      const { from, to, empty } = editor.state.selection;

      if (empty) {
        setCoords(null);
        setShowColorPicker(false);
        return;
      }

      // Compute coordinates from selection range
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        setCoords(null);
        return;
      }

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        setCoords(null);
        return;
      }

      const toolbarWidth = 260;
      const toolbarHeight = 44;

      // Position centered above selection with boundary clamping
      let left = rect.left + rect.width / 2 - toolbarWidth / 2;
      let top = rect.top - toolbarHeight - 8;

      // Viewport boundary clamping
      const padding = 12;
      if (left < padding) left = padding;
      if (left + toolbarWidth > window.innerWidth - padding) {
        left = window.innerWidth - toolbarWidth - padding;
      }

      if (top < padding) {
        // Render below selection if there is not enough room above
        top = rect.bottom + 8;
      }

      setCoords({
        left: left + window.scrollX,
        top: top + window.scrollY,
      });
    };

    editor.on('selectionUpdate', updatePosition);
    editor.on('blur', () => {
      // Delay closing slightly so button clicks inside toolbar can register
      setTimeout(() => {
        if (!document.activeElement?.closest('#floating-highlight-toolbar')) {
          setCoords(null);
          setShowColorPicker(false);
        }
      }, 200);
    });

    return () => {
      editor.off('selectionUpdate', updatePosition);
    };
  }, [editor]);

  if (!mounted || !coords || !editor) return null;

  const handleApplyHighlight = (colorHex: string) => {
    if (editor.isActive('highlight', { color: colorHex })) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color: colorHex }).run();
    }
  };

  return createPortal(
    <div
      id="floating-highlight-toolbar"
      style={{
        position: 'absolute',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999,
      }}
      className="flex items-center gap-1 p-1 bg-surface-1 border border-hairline rounded-lg shadow-xl backdrop-blur-md text-ink animate-in fade-in zoom-in-95 duration-150"
      onMouseDown={(e) => e.preventDefault()} // Prevent losing selection on click
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-surface-2 transition-colors ${
          editor.isActive('bold') ? 'bg-primary-subtle text-primary' : 'text-ink-muted'
        }`}
        title="In đậm (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-surface-2 transition-colors ${
          editor.isActive('italic') ? 'bg-primary-subtle text-primary' : 'text-ink-muted'
        }`}
        title="In nghiêng (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-surface-2 transition-colors ${
          editor.isActive('strike') ? 'bg-primary-subtle text-primary' : 'text-ink-muted'
        }`}
        title="Gạch ngang"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded hover:bg-surface-2 transition-colors ${
          editor.isActive('code') ? 'bg-primary-subtle text-primary' : 'text-ink-muted'
        }`}
        title="Mã code"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-hairline mx-0.5" />

      {/* Highlight color dots */}
      <div className="flex items-center gap-1 px-1">
        {HIGHLIGHT_COLORS.map((hc) => {
          const isActive = editor.isActive('highlight', { color: hc.color });
          return (
            <button
              key={hc.id}
              type="button"
              onClick={() => handleApplyHighlight(hc.color)}
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                isActive ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-hairline'
              }`}
              style={{ backgroundColor: hc.color }}
              title={`Highlight ${hc.label}`}
            />
          );
        })}
      </div>
    </div>,
    document.body
  );
}
