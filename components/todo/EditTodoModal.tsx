'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUpdateTodo, type TodoItemData } from '@/hooks/useTodos';
import { Loader2 } from 'lucide-react';

interface EditTodoModalProps {
  todo: TodoItemData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTodoModal({ todo, isOpen, onClose }: EditTodoModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const updateMutation = useUpdateTodo();

  useEffect(() => {
    if (todo) {
      setTitle(todo.title || '');
      setDescription(todo.description || '');
      setPriority(todo.priority || 'medium');
      if (todo.due_date) {
        const d = new Date(todo.due_date);
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
        setDueDate(localISO);
      } else {
        setDueDate('');
      }
      setErrorMsg('');
    }
  }, [todo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todo) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('Tiêu đề không được để trống');
      return;
    }

    updateMutation.mutate(
      {
        id: todo.id,
        update: {
          title: cleanTitle,
          description: description.trim() || undefined,
          priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => {
          setErrorMsg((err as Error).message || 'Không thể cập nhật todo');
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa công việc">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tiêu đề <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Độ ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Hạn chót
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Mô tả / Ghi chú
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
