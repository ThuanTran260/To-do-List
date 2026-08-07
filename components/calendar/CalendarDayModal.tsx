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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <CalendarIcon className="w-5 h-5" />
              <h3 className="font-bold text-base capitalize text-slate-100">{dateStr}</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddTodo} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Thêm task mới cho ngày này..."
              className="flex-1 px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || createTodo.isPending}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm</span>
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div className="text-xs font-semibold text-slate-400">Công việc trong ngày ({todos.length})</div>
            {todos.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Chưa có công việc nào.
              </div>
            ) : (
              todos.map(t => (
                <div key={t.id} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${t.is_completed ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className={`text-xs font-medium ${t.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {t.title}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    t.priority === 'high' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-400'
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
