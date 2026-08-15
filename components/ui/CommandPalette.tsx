'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTodos } from '@/hooks/useTodos';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  PlusCircle,
  LayoutDashboard,
  Tag,
  Flame,
  Settings,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewTask?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenNewTask }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data } = useTodos(1, 100);
  const todos = data?.todos || [];

  const actions = [
    {
      id: 'create-task',
      title: 'Tạo công việc mới',
      icon: PlusCircle,
      shortcut: 'N',
      action: () => {
        onClose();
        onOpenNewTask?.();
      },
    },
    {
      id: 'nav-dashboard',
      title: 'Đi đến Dashboard',
      icon: LayoutDashboard,
      shortcut: 'G D',
      action: () => {
        onClose();
        router.push('/dashboard');
      },
    },
    {
      id: 'nav-vital',
      title: 'Xem Task Quan Trọng (Vital)',
      icon: Flame,
      shortcut: 'G V',
      action: () => {
        onClose();
        router.push('/dashboard/vital');
      },
    },
    {
      id: 'nav-categories',
      title: 'Quản lý Danh mục (Categories)',
      icon: Tag,
      shortcut: 'G C',
      action: () => {
        onClose();
        router.push('/dashboard/categories');
      },
    },
    {
      id: 'nav-data',
      title: 'Xuất & Nhập dữ liệu (Export / Import)',
      icon: Database,
      shortcut: 'G E',
      action: () => {
        onClose();
        router.push('/dashboard/settings/data');
      },
    },
    {
      id: 'nav-settings',
      title: 'Cài đặt Tài khoản & Mật khẩu',
      icon: Settings,
      shortcut: 'G S',
      action: () => {
        onClose();
        router.push('/dashboard/settings/account');
      },
    },
  ];

  const filteredTasks = query
    ? todos.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const filteredActions = query
    ? actions.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()))
    : actions;

  const totalItems = filteredActions.length + filteredTasks.length;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex < filteredActions.length) {
          filteredActions[selectedIndex]?.action();
        } else {
          const taskIndex = selectedIndex - filteredActions.length;
          const targetTask = filteredTasks[taskIndex];
          if (targetTask) {
            onClose();
            router.push(`/dashboard?search=${encodeURIComponent(targetTask.title)}`);
          }
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalItems, selectedIndex, filteredActions, filteredTasks, router, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-20 px-4 bg-overlay backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-xl bg-surface-1 rounded-xl border border-hairline shadow-2xl overflow-hidden text-ink"
        >
          {/* Search Input Bar */}
          <div className="p-3.5 border-b border-hairline flex items-center gap-3">
            <Search className="w-4 h-4 text-primary shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Gõ lệnh hoặc từ khóa tìm công việc... (Esc để đóng)"
              autoFocus
              className="w-full bg-transparent text-ink placeholder:text-ink-subtle font-medium text-xs sm:text-sm focus:outline-none"
            />
            <kbd className="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline text-ink-subtle font-mono text-[10px] font-medium">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="p-2 space-y-0.5 max-h-[360px] overflow-y-auto">
            {/* Quick Actions Header */}
            {filteredActions.length > 0 && (
              <div className="px-2.5 py-1 text-[10px] font-semibold text-ink-subtle uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-warning" />
                <span>Lệnh Nhanh</span>
              </div>
            )}

            {filteredActions.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;

              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full px-3 py-2 rounded-md flex items-center justify-between transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-primary text-on-primary font-medium'
                      : 'hover:bg-surface-2 text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? 'text-on-primary' : 'text-primary'
                      }`}
                    />
                    <span className="text-xs">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <kbd
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-medium ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-2 text-ink-subtle border border-hairline'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'translate-x-0.5 text-on-primary' : 'opacity-0'
                      }`}
                    />
                  </div>
                </button>
              );
            })}

            {/* Tasks Header */}
            {filteredTasks.length > 0 && (
              <>
                <div className="px-2.5 py-1 text-[10px] font-semibold text-ink-subtle uppercase tracking-wider pt-2 border-t border-hairline">
                  Công Việc ({filteredTasks.length})
                </div>

                {filteredTasks.map((task, idx) => {
                  const globalIdx = filteredActions.length + idx;
                  const isSelected = selectedIndex === globalIdx;

                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        onClose();
                        router.push(`/dashboard?search=${encodeURIComponent(task.title)}`);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full px-3 py-2 rounded-md flex items-center justify-between transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-primary text-on-primary font-medium'
                          : 'hover:bg-surface-2 text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            task.is_completed
                              ? 'text-success'
                              : isSelected
                              ? 'text-on-primary'
                              : 'text-ink-subtle'
                          }`}
                        />
                        <span className="text-xs truncate max-w-sm">
                          {task.title}
                        </span>
                      </div>
                      <ArrowRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isSelected ? 'translate-x-0.5 text-on-primary' : 'opacity-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </>
            )}

            {totalItems === 0 && (
              <div className="p-8 text-center text-xs text-ink-subtle">
                Không tìm thấy lệnh hoặc công việc nào phù hợp với &quot;{query}&quot;
              </div>
            )}
          </div>

          {/* Footer Shortcuts Navigation Bar */}
          <div className="p-2.5 bg-surface-2 border-t border-hairline flex items-center justify-between text-[11px] text-ink-subtle">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="font-mono font-medium text-ink">↑↓</kbd> Điều hướng
              </span>
              <span>
                <kbd className="font-mono font-medium text-ink">Enter</kbd> Chọn
              </span>
            </div>
            <span>
              <kbd className="font-mono font-medium text-ink">Esc</kbd> Đóng
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
