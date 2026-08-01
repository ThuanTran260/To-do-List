'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToggleTodo, useDeleteTodo, type TodoItemData } from '@/hooks/useTodos';
import { PriorityBadge } from '@/components/ui/Badge';
import { EditTodoModal } from '@/components/todo/EditTodoModal';
import { Check, Edit3, Trash2, Calendar, Clock, Eye } from 'lucide-react';

interface TodoItemProps {
  item: TodoItemData;
}

export function TodoItem({ item }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();

  const handleOpenDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('task', item.id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Due date formatting & status calculation
  let isOverdue = false;
  let formattedDueDate = '';
  if (item.due_date) {
    const due = new Date(item.due_date);
    isOverdue = due < new Date() && !item.is_completed;
    formattedDueDate = due.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <>
      <div
        className={`group relative p-4 rounded-2xl border backdrop-blur-md transition-all duration-200 hover:shadow-xl ${
          item.is_completed
            ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/40 opacity-75'
            : isOverdue
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40'
            : 'glass-panel bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-700'
        }`}
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          {/* Left Column: Checkbox & Content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={() =>
                toggleMutation.mutate({ id: item.id, is_completed: !item.is_completed })
              }
              disabled={toggleMutation.isPending}
              className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                item.is_completed
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-800'
              }`}
              title={item.is_completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
            >
              {item.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  onClick={handleOpenDetail}
                  className={`font-bold text-sm sm:text-base cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-words ${
                    item.is_completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {item.title}
                </span>
                <PriorityBadge priority={item.priority} />
                {item.is_completed ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                    Status: Done
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                    Status: Not Started
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
                  {item.description}
                </p>
              )}

              {/* Meta information & Action Links */}
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap pt-0.5">
                {item.due_date && (
                  <div
                    className={`flex items-center gap-1 font-semibold text-[11px] ${
                      isOverdue
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isOverdue ? <Clock className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                    <span>{isOverdue ? `Quá hạn: ${formattedDueDate}` : formattedDueDate}</span>
                  </div>
                )}

                <button
                  onClick={handleOpenDetail}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem chi tiết</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Thumbnail Image (If available) */}
          {item.image_url && (
            <div
              onClick={handleOpenDetail}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 flex-shrink-0 cursor-pointer group-hover:shadow-md transition-all relative"
            >
              {/* eslint-disable-next-html-link */}
              <img
                src={item.image_url}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-2xl"
              />
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Chỉnh sửa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Bạn có chắc chắn muốn xóa "${item.title}"?`)) {
                  deleteMutation.mutate(item.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Xóa công việc"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <EditTodoModal todo={item} isOpen={isEditing} onClose={() => setIsEditing(false)} />
    </>
  );
}
