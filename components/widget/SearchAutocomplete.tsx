'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTodos, type TodoItemData } from '@/hooks/useTodos';
import { useDropdownManager } from '@/hooks/useDropdownManager';
import { FloatingPanel } from '@/components/ui/FloatingPanel';
import { LoadingSkeleton } from '@/components/ui/state/LoadingSkeleton';
import { EmptyState } from '@/components/ui/state/EmptyState';
import { ErrorState } from '@/components/ui/state/ErrorState';
import { EditTodoModal } from '@/components/todo/EditTodoModal';
import { filterSearchTodos } from '@/lib/searchFilter';
import { Search } from 'lucide-react';

export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedTask, setSelectedTask] = useState<TodoItemData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { activePanel, togglePanel, closeAll } = useDropdownManager();
  const isOpen = activePanel === 'search';
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, refetch } = useTodos(1, 100);
  const todos = data?.todos || [];

  // Responsive mobile detection
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll on mobile when search overlay is open
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || 'unset';
      };
    }
  }, [isOpen, isMobile]);

  // Debounce 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Use pure search filter helper
  const filteredTodos = debouncedQuery ? filterSearchTodos(todos, debouncedQuery, 8) : [];

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredTodos.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredTodos.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredTodos.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredTodos.length) {
        setSelectedTask(filteredTodos[selectedIndex]);
        closeAll();
      }
    } else if (e.key === 'Escape') {
      closeAll();
      inputRef.current?.blur();
      mobileInputRef.current?.blur();
    }
  };

  // Highlight matching keyword
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedSearch})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-primary/20 text-primary px-0.5 rounded font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Shared search results renderer
  const renderSearchResults = () => {
    if (isLoading) {
      return <LoadingSkeleton variant="text" count={3} />;
    }
    if (isError) {
      return <ErrorState message="Không thể tìm kiếm công việc" onRetry={refetch} />;
    }
    if (filteredTodos.length === 0) {
      return (
        <EmptyState
          icon={Search}
          title="Không tìm thấy kết quả"
          description={`Không có công việc nào khớp với từ khóa "${debouncedQuery}"`}
        />
      );
    }
    return (
      <div id="search-suggestions-listbox" className="space-y-0.5" role="listbox">
        <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-semibold text-ink-subtle uppercase tracking-wider border-b border-hairline">
          <span>Gợi ý ({filteredTodos.length})</span>
          <span className="hidden sm:inline">Dùng 🠗🠕 & Enter để chọn</span>
        </div>

        {filteredTodos.map((task, index) => (
          <div
            key={task.id}
            onClick={() => {
              setSelectedTask(task);
              closeAll();
            }}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`p-2 rounded-md cursor-pointer transition-colors flex items-center justify-between gap-2.5 text-xs ${
              selectedIndex === index
                ? 'bg-primary text-on-primary font-medium'
                : 'hover:bg-surface-2 text-ink'
            }`}
            role="option"
            aria-selected={selectedIndex === index}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {highlightText(task.title, debouncedQuery)}
              </p>
              {task.description && (
                <p
                  className={`text-[11px] truncate ${
                    selectedIndex === index
                      ? 'text-white/80'
                      : 'text-ink-subtle'
                  }`}
                >
                  {highlightText(task.description, debouncedQuery)}
                </p>
              )}
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase border flex-shrink-0 ${
                task.priority === 'high'
                  ? 'bg-danger/10 text-danger border-danger/20'
                  : task.priority === 'medium'
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : 'bg-success/10 text-success border-success/20'
              }`}
            >
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="relative flex-1 max-w-md">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) togglePanel('search');
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (!isMobile) {
              if (query && !isOpen) togglePanel('search');
            } else {
              if (!isOpen) togglePanel('search');
            }
          }}
          onClick={() => {
            if (isMobile && !isOpen) togglePanel('search');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Tìm kiếm công việc..."
          className="w-full bg-surface-2 pl-8 pr-3 py-1.5 rounded-md text-xs text-ink placeholder:text-ink-subtle border border-hairline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium cursor-text"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-suggestions-listbox"
          role="combobox"
        />

        {/* Desktop Dropdown via FloatingPanel (hidden on mobile, mobile uses Portal overlay) */}
        {!isMobile && (
          <FloatingPanel
            isOpen={isOpen && !!debouncedQuery}
            onClose={closeAll}
            className="w-full max-w-md p-2.5 space-y-2 mt-1 left-0 right-auto"
          >
            {renderSearchResults()}
          </FloatingPanel>
        )}
      </div>

      {/* Mobile Expandable Search Portal to document.body */}
      {mounted && isMobile && isOpen && createPortal(
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[8999]"
            onClick={() => {
              closeAll();
            }}
          />

          {/* Full-width Header Search Bar Overlay */}
          <div className="fixed inset-x-0 top-0 h-14 bg-surface-1 z-[9000] border-b border-hairline px-3 flex items-center gap-2 shadow-md">
            <Search className="w-4 h-4 text-ink-subtle flex-shrink-0" />
            <input
              ref={mobileInputRef}
              autoFocus
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm công việc..."
              className="flex-1 min-w-0 bg-surface-2 px-3 py-1.5 rounded-md text-sm text-ink placeholder:text-ink-subtle border border-hairline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
            />
            <button
              type="button"
              onClick={() => {
                setQuery('');
                closeAll();
              }}
              className="px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-ink cursor-pointer flex-shrink-0"
            >
              Hủy
            </button>
          </div>

          {/* Results dropdown below header search bar */}
          {!!debouncedQuery && (
            <div
              className="fixed inset-x-3 top-16 z-[9000] max-w-lg mx-auto max-h-[85dvh] overflow-y-auto surface-panel bg-surface-1 border border-hairline rounded-xl shadow-2xl p-2.5 space-y-2"
              role="listbox"
            >
              {renderSearchResults()}
            </div>
          )}
        </>,
        document.body
      )}

      {selectedTask && (
        <EditTodoModal
          todo={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
