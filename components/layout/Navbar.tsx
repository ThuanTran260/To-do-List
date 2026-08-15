'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Trash2, CheckCircle2, User as UserIcon } from 'lucide-react';
import { TrashModal } from '@/components/todo/TrashModal';

export function Navbar() {
  const { user } = useAuth();
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-'))
        .forEach((key) => localStorage.removeItem(key));
    } catch {}
    try { sessionStorage.clear(); } catch {}

    window.location.href = '/auth/logout';
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-hairline bg-surface-1/90 backdrop-blur-md transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-ink">
                Flow State
              </h1>
              <p className="text-[10px] text-ink-subtle font-medium -mt-0.5 hidden sm:block">
                Focus & Productivity System
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Trash Button */}
            <button
              onClick={() => setIsTrashOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 border border-hairline transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Thùng rác"
            >
              <Trash2 className="w-3.5 h-3.5 text-danger" />
              <span className="hidden sm:inline">Thùng rác</span>
            </button>

            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-hairline">
                <div className="w-7 h-7 rounded-full bg-primary-subtle text-primary border border-primary-border flex items-center justify-center font-semibold text-xs">
                  {user.email ? user.email[0].toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-md text-ink-subtle hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Trash Modal */}
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
    </>
  );
}
