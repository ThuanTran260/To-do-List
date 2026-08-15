'use client';

import { useTodos } from '@/hooks/useTodos';
import { TodoItem } from '@/components/todo/TodoItem';
import { TaskDetailView } from '@/components/todo/TaskDetailView';
import { AlertOctagon, Sparkles } from 'lucide-react';

export default function VitalTasksPage() {
  const { data, isLoading } = useTodos(1, 100);
  const vitalTodos = data?.todos.filter((t) => t.priority === 'high' || t.is_vital) || [];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-xl surface-panel bg-surface-1 border border-hairline flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-danger" />
            <h2 className="text-base sm:text-lg font-semibold text-ink">
              Vital Tasks (Công việc quan trọng)
            </h2>
          </div>
          <p className="text-xs text-ink-subtle font-normal">
            Danh sách các công việc ưu tiên cao và quan trọng cần hoàn thành sớm nhất.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-danger/10 text-danger text-xs font-medium border border-danger/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{vitalTodos.length} Công việc quan trọng</span>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 rounded-lg bg-surface-2 animate-pulse border border-hairline" />
          ))}
        </div>
      ) : vitalTodos.length === 0 ? (
        <div className="py-12 text-center rounded-xl bg-surface-1 border border-dashed border-hairline space-y-2">
          <AlertOctagon className="w-8 h-8 text-ink-subtle mx-auto opacity-40" />
          <h3 className="text-sm font-semibold text-ink">
            Không có công việc quan trọng nào
          </h3>
          <p className="text-xs text-ink-subtle max-w-sm mx-auto font-normal">
            Các công việc có mức ưu tiên Cao sẽ tự động xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {vitalTodos.map((item) => (
            <TodoItem key={item.id} item={item} />
          ))}
        </div>
      )}

      <TaskDetailView />
    </div>
  );
}
