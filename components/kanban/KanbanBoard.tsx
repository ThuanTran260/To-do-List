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
      color: 'text-primary',
      bgColor: 'bg-primary-subtle',
      tasks: todoTasks,
    },
    {
      id: 'high',
      title: 'Ưu Tiên Cao',
      icon: Flame,
      color: 'text-danger',
      bgColor: 'bg-danger/10',
      tasks: highPriorityTasks,
    },
    {
      id: 'completed',
      title: 'Đã Hoàn Thành',
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
      tasks: completedTasks,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary-subtle text-primary border border-primary-border">
          <Columns3 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            Bảng Kanban (Kanban Board)
          </h2>
          <p className="text-xs text-ink-subtle font-normal">
            Trực quan hóa tiến độ công việc theo các cột trạng thái
          </p>
        </div>
      </div>

      {/* 3 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {columns.map((col) => (
          <KanbanColumn key={col.id} {...col} />
        ))}
      </div>
    </div>
  );
}
