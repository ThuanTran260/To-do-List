'use client';

import { useTheme } from '@/providers/ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/40 backdrop-blur-sm">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
          theme === 'light'
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
          theme === 'dark'
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
          theme === 'system'
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        }`}
        title="System Preference"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
