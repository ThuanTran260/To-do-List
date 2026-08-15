'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, CheckCircle2, Plus } from 'lucide-react';
import type { TodoItemData } from '@/types/todo';
import { useState } from 'react';
import { useCreateTodo } from '@/hooks/useTodos';
import { toast } from 'sonner';

interface CalendarDayModalProps {
  date: Date | null;
  todos: TodoItemData[];
  onClose: () => void;
}

export function CalendarDayModal({ date, todos, onClose }: CalendarDayModalProps) {
  const [newTitle, setNewTitle] = useState('');
  const createTodo = useCreateTodo();

  if (!date) return null;

  const dateStr = date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await createTodo.mutateAsync({
        title: newTitle,
        priority: 'medium',
        due_date: date.toISOString(),
      });
      setNewTitle('');
      toast.success('Đã thêm công việc cho ngày ' + date.getDate());
    } catch {
      toast.error('Lỗi khi thêm công việc');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="w-full max-w-md bg-surface-1 border border-hairline rounded-xl p-5 shadow-2xl space-y-4 text-ink"
        >
          <div className="flex items-center justify-between pb-2 border-b border-hairline">
            <div className="flex items-center gap-2 text-primary">
              <CalendarIcon className="w-4 h-4" />
              <h3 className="font-semibold text-sm capitalize text-ink">{dateStr}</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddTodo} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Thêm việc mới cho ngày này..."
              className="flex-1 px-3 py-1.5 text-xs bg-surface-2 border border-hairline rounded-md text-ink placeholder:text-ink-subtle focus:outline-none focus:border-primary-border font-medium"
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || createTodo.isPending}
              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-on-primary rounded-md font-medium text-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm</span>
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div className="text-xs font-semibold text-ink-subtle">Công việc trong ngày ({todos.length})</div>
            {todos.length === 0 ? (
              <div className="p-4 text-center text-xs text-ink-subtle border border-dashed border-hairline rounded-lg">
                Chưa có công việc nào.
              </div>
            ) : (
              todos.map(t => (
                <div key={t.id} className="p-2.5 bg-surface-2 border border-hairline rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${t.is_completed ? 'text-success' : 'text-ink-subtle'}`} />
                    <span className={`text-xs font-medium ${t.is_completed ? 'line-through text-ink-subtle' : 'text-ink'}`}>
                      {t.title}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    t.priority === 'high' ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-surface-1 border border-hairline text-ink-muted'
                  }`}>
                    {t.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
