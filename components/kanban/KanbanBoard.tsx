'use client';

import { useTodos } from '@/hooks/useTodos';
import { Columns3, CheckCircle2, Clock, Flame } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';

export function KanbanBoard() {
  const { data } = useTodos(1, 200);
  const todos = data?.todos || [];

  const todoTasks = todos.filter((t) => !t.is_completed && t.priority !== 'high');
  const highPriorityTasks = todos.filter((t) => !t.is_completed && t.priority === 'high');
  const completedTasks = todos.filter((t) => t.is_completed);

  const columns = [
    {
      id: 'active',
      title: 'Đang Thực Hiện',
      icon: Clock,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      tasks: todoTasks,
    },
    {
      id: 'high',
      title: 'Ưu Tiên Cao',
      icon: Flame,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      tasks: highPriorityTasks,
    },
    {
      id: 'completed',
      title: 'Đã Hoàn Thành',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      tasks: completedTasks,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20">
          <Columns3 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Bảng Kanban (Kanban Board)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Trực quan hóa tiến độ công việc theo các cột trạng thái
          </p>
        </div>
      </div>

      {/* 3 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((col) => (
          <KanbanColumn key={col.id} {...col} />
        ))}
      </div>
    </div>
  );
}
