'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onCommandPalette?: () => void;
  onNewTask?: () => void;
  onHelpModal?: () => void;
  onSearchFocus?: () => void;
}

export function useKeyboardShortcuts({
  onCommandPalette,
  onNewTask,
  onHelpModal,
  onSearchFocus,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is inside an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Ctrl+K or Cmd+K -> Toggle Command Palette (Works anywhere)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onCommandPalette?.();
        return;
      }

      // Ignore single key shortcuts if typing in an input
      if (isInput) return;

      // N -> New Task
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onNewTask?.();
        return;
      }

      // / -> Focus Search Bar
      if (e.key === '/') {
        e.preventDefault();
        onSearchFocus?.();
        return;
      }

      // ? -> Open Shortcuts Help Modal
      if (e.key === '?') {
        e.preventDefault();
        onHelpModal?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCommandPalette, onNewTask, onHelpModal, onSearchFocus]);
}
