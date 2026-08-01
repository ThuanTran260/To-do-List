'use client';

import { useTodos } from '@/hooks/useTodos';
import { TodoItem } from '@/components/todo/TodoItem';
import { AlertOctagon, Sparkles } from 'lucide-react';

export default function VitalTasksPage() {
  const { data, isLoading } = useTodos(1, 100);
  const vitalTodos = data?.todos.filter((t) => t.priority === 'high' || t.is_vital) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl glass-panel bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-500/20 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-rose-500" />
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Vital Tasks (Công việc quan trọng)
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Danh sách các công việc ưu tiên cao và quan trọng cần hoàn thành sớm nhất.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30">
          <Sparkles className="w-4 h-4" />
          <span>{vitalTodos.length} Công việc quan trọng</span>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 rounded-2xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      ) : vitalTodos.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel bg-white/40 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
          <AlertOctagon className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Không có công việc quan trọng nào
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Các công việc có mức ưu tiên Cao sẽ tự động xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vitalTodos.map((item) => (
            <TodoItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
