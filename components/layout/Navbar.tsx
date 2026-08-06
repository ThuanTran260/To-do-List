'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Trash2, CheckCircle2, User as UserIcon, Sparkles } from 'lucide-react';
import { TrashModal } from '@/components/todo/TrashModal';

export function Navbar() {
  const { user } = useAuth();
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    // scope: 'global' revokes the refresh token on Supabase Auth server,
    // invalidating ALL active sessions across every device for this user.
    await supabase.auth.signOut({ scope: 'global' });
    // Selectively purge only Supabase auth token keys (sb-*) from localStorage.
    // Preserves other keys like 'flowstate-theme' (user settings survive logout).
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-'))
        .forEach((key) => localStorage.removeItem(key));
    } catch {}
    try { sessionStorage.clear(); } catch {}
    window.location.href = '/login';
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/75 dark:bg-slate-950/75 backdrop-blur-2xl transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                Flow State
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-1 hidden sm:block">
                Focus & Productivity System
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {/* Trash Button */}
            <button
              onClick={() => setIsTrashOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold hover:border-indigo-300 dark:hover:border-indigo-700 active:scale-95 cursor-pointer"
              title="Thùng rác"
            >
              <Trash2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span className="hidden sm:inline">Thùng rác</span>
            </button>

            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30 shadow-sm">
                  {user.email ? user.email[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all active:scale-95 cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
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
