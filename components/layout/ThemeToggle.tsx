'use client';

import { useTheme } from '@/providers/ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-surface-2 border border-hairline">
      <button
        onClick={() => setTheme('light')}
        className={`p-1 rounded text-xs transition-colors ${
          theme === 'light'
            ? 'bg-surface-1 text-primary shadow-xs border border-hairline'
            : 'text-ink-subtle hover:text-ink'
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1 rounded text-xs transition-colors ${
          theme === 'dark'
            ? 'bg-surface-1 text-primary shadow-xs border border-hairline'
            : 'text-ink-subtle hover:text-ink'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1 rounded text-xs transition-colors ${
          theme === 'system'
            ? 'bg-surface-1 text-primary shadow-xs border border-hairline'
            : 'text-ink-subtle hover:text-ink'
        }`}
        title="System Preference"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
