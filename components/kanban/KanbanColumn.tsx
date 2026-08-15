'use client';

import { ElementType } from 'react';
import { KanbanCard } from './KanbanCard';
import type { TodoItemData } from '@/types/todo';

interface KanbanColumnProps {
  id: string;
  title: string;
  icon: ElementType;
  color: string;
  bgColor: string;
  tasks: TodoItemData[];
}

export function KanbanColumn({ title, icon: Icon, color, bgColor, tasks }: KanbanColumnProps) {
  return (
    <div className="p-4 sm:p-5 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-4 min-h-[480px] flex flex-col justify-between shadow-xs">
      <div>
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md border border-hairline ${bgColor} ${color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-semibold text-xs sm:text-sm text-ink">
              {title}
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-surface-2 font-medium text-[11px] text-ink-muted border border-hairline">
            {tasks.length}
          </span>
        </div>

        {/* Cards List */}
        <div className="space-y-2.5 pt-3">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}

          {tasks.length === 0 && (
            <div className="p-8 text-center text-xs text-ink-subtle italic border border-dashed border-hairline rounded-lg">
              Không có công việc nào ở cột này
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
