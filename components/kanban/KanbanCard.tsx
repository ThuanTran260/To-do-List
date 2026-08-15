'use client';

import { PriorityBadge } from '@/components/ui/Badge';
import { ArrowRight } from 'lucide-react';
import type { TodoItemData } from '@/types/todo';
import { useToggleTodo } from '@/hooks/useTodos';

interface KanbanCardProps {
  task: TodoItemData;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const toggleMutation = useToggleTodo();

  return (
    <div
      className="p-3 rounded-lg bg-surface-2 border border-hairline hover:border-hairline-strong card-hover space-y-2 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <h4
          className={`text-xs font-medium leading-snug break-words ${
            task.is_completed ? 'line-through text-ink-subtle' : 'text-ink'
          }`}
        >
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed font-normal">
          {task.description}
        </p>
      )}

      {/* Action Button */}
      <div className="pt-2 border-t border-hairline flex items-center justify-between">
        <span className="text-[10px] text-ink-subtle font-normal">
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
          className="text-[11px] font-medium text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
        >
          <span>{task.is_completed ? 'Mở lại' : 'Xong'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
