'use client';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { SearchAutocomplete } from '@/components/widget/SearchAutocomplete';
import { CalendarPopover } from '@/components/widget/CalendarPopover';
import { NotificationPopover } from '@/components/widget/NotificationPopover';
import { WorldClockWidget } from '@/components/widget/WorldClockWidget';
import { Menu, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { TrashModal } from '@/components/todo/TrashModal';

interface HeaderProps {
  onOpenSidebar?: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full surface-panel bg-surface-1/90 border-b border-hairline backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Mobile Sidebar Toggle Button & Realtime World Clock */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSidebar}
              className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 lg:hidden cursor-pointer"
              title="Mở Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Real-time World Clock Widget */}
            <WorldClockWidget />
          </div>

          {/* Search Autocomplete Bar */}
          <SearchAutocomplete />

          {/* Controls Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true });
                window.dispatchEvent(event);
              }}
              className="px-2 py-1 rounded-md text-xs font-medium text-ink-subtle bg-surface-2 border border-hairline hover:text-primary hover:border-primary-border flex items-center gap-1 transition-colors cursor-pointer"
              title="Mở Command Palette (Ctrl+K)"
            >
              <span className="font-mono">⌘K</span>
            </button>
            <ThemeToggle />
            <CalendarPopover />
            <NotificationPopover />

            {/* Trash Bin button */}
            <button
              onClick={() => setIsTrashOpen(true)}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-2 border border-hairline flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-danger" />
              <span className="hidden sm:inline">Thùng rác</span>
            </button>
          </div>
        </div>
      </header>

      {/* Trash Modal */}
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
    </>
  );
}
