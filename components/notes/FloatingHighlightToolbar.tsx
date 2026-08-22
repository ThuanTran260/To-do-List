'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Code } from 'lucide-react';
import { HIGHLIGHT_COLORS } from '@/lib/noteColors';

interface FloatingHighlightToolbarProps {
  editor: Editor | null;
}

export function FloatingHighlightToolbar({ editor }: FloatingHighlightToolbarProps) {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!editor) return;

    const updatePosition = () => {
      const { empty } = editor.state.selection;

      if (empty) {
        setCoords(null);
        return;
      }

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

      setCoords((prev) => {
        if (prev && Math.abs(prev.left - left) < 1 && Math.abs(prev.top - top) < 1) {
          return prev;
        }
        return { left, top };
      });
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (!document.activeElement?.closest('#floating-highlight-toolbar')) {
          setCoords(null);
        }
      }, 200);
    };

    editor.on('selectionUpdate', updatePosition);
    editor.on('blur', handleBlur);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('blur', handleBlur);
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
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999,
      }}
      className="flex items-center gap-1 p-1 bg-surface-1 border border-hairline rounded-lg shadow-xl backdrop-blur-md text-ink animate-in fade-in zoom-in-95 duration-150"
      onMouseDown={(e) => e.preventDefault()} // Prevent losing selection on click
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-surface-2 transition-colors cursor-pointer ${
          editor.isActive('bold') ? 'bg-primary-subtle text-primary' : 'text-ink-muted'
        }`}
        title="In đậm (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-surface-2 transition-colors cursor-pointer ${
          editor.isActive('italic') ? 'bg-primary-subtle text-primary' : 'text-ink-muted'
        }`}
        title="In nghiêng (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-surface-2 transition-colors cursor-pointer ${
          editor.isActive('strike') ? 'bg-primary-subtle text-primary' : 'text-ink-muted'
        }`}
        title="Gạch ngang"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded hover:bg-surface-2 transition-colors cursor-pointer ${
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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleApplyHighlight(hc.color)}
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                isActive ? 'border-primary ring-2 ring-primary/40 scale-105' : 'border-hairline'
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
