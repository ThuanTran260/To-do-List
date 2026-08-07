'use client';

import { motion } from 'framer-motion';
import { PriorityBadge } from '@/components/ui/Badge';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { TodoItemData } from '@/types/todo';
import { useToggleTodo } from '@/hooks/useTodos';

interface KanbanCardProps {
  task: TodoItemData;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const toggleMutation = useToggleTodo();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2.5 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <h4
          className={`text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug ${
            task.is_completed ? 'line-through text-slate-400' : ''
          }`}
        >
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Action Button */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-semibold">
          {task.due_date
            ? new Date(task.due_date).toLocaleDateString('vi-VN')
            : 'Không hạn'}
        </span>
        <button
          onClick={() =>
            toggleMutation.mutate({
              id: task.id,
              is_completed: !task.is_completed,
              currentTodo: task,
            })
          }
          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{task.is_completed ? 'Mở lại' : 'Xong'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
