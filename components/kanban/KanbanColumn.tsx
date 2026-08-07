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
    <div className="p-5 rounded-3xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4 min-h-[480px] flex flex-col justify-between">
      <div>
        {/* Column Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${bgColor} ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-600 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>

        {/* Cards List */}
        <div className="space-y-3 pt-4">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}

          {tasks.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              Không có công việc nào ở cột này
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
