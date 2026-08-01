'use client';

import { useState, useEffect, useRef } from 'react';
import { useTodos, type TodoItemData } from '@/hooks/useTodos';
import { useDropdownManager } from '@/hooks/useDropdownManager';
import { FloatingPanel } from '@/components/ui/FloatingPanel';
import { LoadingSkeleton } from '@/components/ui/state/LoadingSkeleton';
import { EmptyState } from '@/components/ui/state/EmptyState';
import { ErrorState } from '@/components/ui/state/ErrorState';
import { EditTodoModal } from '@/components/todo/EditTodoModal';
import { Search, Tag, Calendar, Sparkles } from 'lucide-react';

export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedTask, setSelectedTask] = useState<TodoItemData | null>(null);

  const { activePanel, togglePanel, closeAll } = useDropdownManager();
  const isOpen = activePanel === 'search';
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, refetch } = useTodos(1, 100);
  const todos = data?.todos || [];

  // Debounce 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Remove accents for diacritic-insensitive search
  const removeAccents = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredTodos = debouncedQuery
    ? todos.filter((t) => {
        const q = removeAccents(debouncedQuery);
        const titleMatch = removeAccents(t.title).includes(q);
        const descMatch = t.description ? removeAccents(t.description).includes(q) : false;
        return titleMatch || descMatch;
      }).slice(0, 8)
    : [];

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
            <mark key={i} className="bg-amber-300 dark:bg-indigo-500/40 text-slate-900 dark:text-indigo-200 px-0.5 rounded font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <>
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
            if (query && !isOpen) togglePanel('search');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Gõ từ khóa tìm kiếm (VibeCoding, Nấu Ăn...)"
          className="w-full bg-slate-100/80 dark:bg-slate-900/80 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />

        <FloatingPanel
          isOpen={isOpen && !!debouncedQuery}
          onClose={closeAll}
          className="w-full max-w-md p-3 space-y-2 mt-2 left-0 right-auto"
        >
          {isLoading ? (
            <LoadingSkeleton variant="text" count={3} />
          ) : isError ? (
            <ErrorState message="Không thể tìm kiếm công việc" onRetry={refetch} />
          ) : filteredTodos.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Không tìm thấy kết quả"
              description={`Không có công việc nào khớp với từ khóa "${debouncedQuery}"`}
            />
          ) : (
            <div className="space-y-1" role="listbox">
              <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/50">
                <span>Gợi ý ({filteredTodos.length})</span>
                <span>Dùng 🠗🠕 & Enter để chọn</span>
              </div>

              {filteredTodos.map((task, index) => (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    closeAll();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                    selectedIndex === index
                      ? 'bg-indigo-600 text-white font-semibold shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {highlightText(task.title, debouncedQuery)}
                    </p>
                    {task.description && (
                      <p
                        className={`text-[11px] truncate ${
                          selectedIndex === index
                            ? 'text-indigo-100'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {highlightText(task.description, debouncedQuery)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      task.priority === 'high'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </FloatingPanel>
      </div>

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
