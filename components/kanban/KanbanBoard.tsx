'use client';

import { useTodos, useToggleTodo, useUpdateTodo } from '@/hooks/useTodos';
import { PriorityBadge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { Columns3, CheckCircle2, Clock, Flame, ArrowRight } from 'lucide-react';

export function KanbanBoard() {
  const { data } = useTodos(1, 200);
  const toggleMutation = useToggleTodo();
  const updateMutation = useUpdateTodo();
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
        {columns.map((col) => {
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className="p-5 rounded-3xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4 min-h-[480px] flex flex-col justify-between"
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${col.bgColor} ${col.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {col.title}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-600 dark:text-slate-400">
                    {col.tasks.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 pt-4">
                  {col.tasks.map((task) => (
                    <motion.div
                      key={task.id}
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
                            })
                          }
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{task.is_completed ? 'Mở lại' : 'Xong'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {col.tasks.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400 italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      Không có công việc nào ở cột này
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
