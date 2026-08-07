'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  useKeyboardShortcuts({
    onCommandPalette: () => setIsCommandPaletteOpen((prev) => !prev),
    onNewTask: () => {
      const titleInput = document.getElementById('todo-title-input') as HTMLInputElement;
      if (titleInput) {
        titleInput.focus();
      }
    },
    onSearchFocus: () => {
      const searchInput = document.getElementById('search-autocomplete-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    onHelpModal: () => setIsShortcutsHelpOpen((prev) => !prev),
  });

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 mesh-gradient-bg transition-colors">
      {/* Permanent Left Sidebar for Desktop, Drawer for Mobile */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNewTask={() => {
          const titleInput = document.getElementById('todo-title-input') as HTMLInputElement;
          if (titleInput) titleInput.focus();
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
}
