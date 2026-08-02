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
      <header className="sticky top-0 z-30 w-full glass-panel bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-2xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Mobile Sidebar Toggle Button & Realtime World Clock */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSidebar}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
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
            <ThemeToggle />
            <CalendarPopover />
            <NotificationPopover />

            {/* Trash Bin button */}
            <button
              onClick={() => setIsTrashOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
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
