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

  // Define Quick Actions
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

  // Filter tasks based on query
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
      <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Search Input Bar */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <Search className="w-5 h-5 text-indigo-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Gõ lệnh hoặc từ khóa tìm công việc... (Esc để đóng)"
              autoFocus
              className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium text-sm focus:outline-none"
            />
            <kbd className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 font-mono text-[10px] font-bold">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="p-2 space-y-1 max-h-[360px] overflow-y-auto">
            {/* Quick Actions Header */}
            {filteredActions.length > 0 && (
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
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
                  className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4.5 h-4.5 ${
                        isSelected ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'
                      }`}
                    />
                    <span className="text-xs font-semibold">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <kbd
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'translate-x-0.5 text-white' : 'opacity-0'
                      }`}
                    />
                  </div>
                </button>
              );
            })}

            {/* Tasks Header */}
            {filteredTasks.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                  Công Việc Khớp Từ Khóa ({filteredTasks.length})
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
                      className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            task.is_completed
                              ? 'text-emerald-500'
                              : isSelected
                              ? 'text-white'
                              : 'text-slate-400'
                          }`}
                        />
                        <span className="text-xs font-semibold truncate max-w-sm">
                          {task.title}
                        </span>
                      </div>
                      <ArrowRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'translate-x-0.5 text-white' : 'opacity-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </>
            )}

            {totalItems === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                Không tìm thấy lệnh hoặc công việc nào phù hợp với &quot;{query}&quot;
              </div>
            )}
          </div>

          {/* Footer Shortcuts Navigation Bar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="font-mono font-bold text-slate-600 dark:text-slate-300">↑↓</kbd> Điều hướng
              </span>
              <span>
                <kbd className="font-mono font-bold text-slate-600 dark:text-slate-300">Enter</kbd> Chọn
              </span>
            </div>
            <span>
              <kbd className="font-mono font-bold text-slate-600 dark:text-slate-300">Esc</kbd> Đóng
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
