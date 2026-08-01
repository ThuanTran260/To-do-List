'use client';

import { useState } from 'react';
import { useToggleTodo, useDeleteTodo, type TodoItemData } from '@/hooks/useTodos';
import { PriorityBadge } from '@/components/ui/Badge';
import { EditTodoModal } from '@/components/todo/EditTodoModal';
import { Check, Edit3, Trash2, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface TodoItemProps {
  item: TodoItemData;
}

export function TodoItem({ item }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();

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
        className={`group relative p-4 rounded-2xl border backdrop-blur-md transition-all duration-200 hover:shadow-lg ${
          item.is_completed
            ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/40 opacity-70'
            : isOverdue
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40'
            : 'glass-panel bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-800'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Checkbox + Title Row */}
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
            >
              {item.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-semibold text-sm sm:text-base transition-all break-words ${
                    item.is_completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {item.title}
                </span>
                <PriorityBadge priority={item.priority} />
              </div>

              {/* Badges & Meta info */}
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                {item.due_date && (
                  <div
                    className={`flex items-center gap-1 font-medium text-[11px] ${
                      isOverdue
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isOverdue ? <Clock className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                    <span>{isOverdue ? `Quá hạn: ${formattedDueDate}` : formattedDueDate}</span>
                  </div>
                )}

                {item.description && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium"
                  >
                    <span>{isExpanded ? 'Ẩn ghi chú' : 'Xem ghi chú'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              title="Sửa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteMutation.mutate(item.id)}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Chuyển vào thùng rác"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Description */}
        {isExpanded && item.description && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-150">
            {item.description}
          </div>
        )}
      </div>

      <EditTodoModal
        todo={item}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
      />
    </>
  );
}
