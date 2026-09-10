'use client';

import { useTheme } from '@/providers/ThemeProvider';
import { getNextTheme } from '@/lib/themeUtils';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Mobile Compact 1-Button Toggle */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setTheme(getNextTheme(theme))}
          className="p-1.5 rounded-md bg-surface-2 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer"
          title={`Theme hiện tại: ${theme}. Bấm để đổi.`}
        >
          {theme === 'light' ? (
            <Sun className="w-4 h-4 text-warning" />
          ) : theme === 'dark' ? (
            <Moon className="w-4 h-4 text-primary" />
          ) : (
            <Monitor className="w-4 h-4 text-ink-subtle" />
          )}
        </button>
      </div>

      {/* Desktop 3-Button Toggle */}
      <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-md bg-surface-2 border border-hairline">
        <button
          onClick={() => setTheme('light')}
          className={`p-1 rounded text-xs transition-colors cursor-pointer ${
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
          className={`p-1 rounded text-xs transition-colors cursor-pointer ${
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
          className={`p-1 rounded text-xs transition-colors cursor-pointer ${
            theme === 'system'
              ? 'bg-surface-1 text-primary shadow-xs border border-hairline'
              : 'text-ink-subtle hover:text-ink'
          }`}
          title="System Preference"
        >
          <Monitor className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}
