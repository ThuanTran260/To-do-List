'use client';

import { motion } from 'framer-motion';
import { Flame, CheckCircle2, ArrowRight } from 'lucide-react';
import type { TodoItemData } from '@/types/todo';
import { useToggleTodo, useUpdateTodo } from '@/hooks/useTodos';
import { ChecklistEditor } from '@/components/todo/ChecklistEditor';

interface FocusTaskProps {
  task: TodoItemData;
  currentIndex: number;
  totalTasks: number;
  onNext: () => void;
}

export function FocusTask({ task, currentIndex, totalTasks, onNext }: FocusTaskProps) {
  const toggleMutation = useToggleTodo();
  const updateMutation = useUpdateTodo();

  const handleChecklistChange = (newChecklist: any[]) => {
    updateMutation.mutate({
      id: task.id,
      update: { checklist: newChecklist },
    });
  };

  return (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      className="p-8 sm:p-10 rounded-3xl glass-panel bg-white/90 dark:bg-slate-900/90 border border-indigo-500/30 shadow-2xl space-y-6 text-left relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-500/20 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5" />
          <span>Đang Tập Trung</span>
        </span>
        <span className="text-xs text-slate-400 font-medium">
          Task {currentIndex + 1} / {totalTasks}
        </span>
      </div>

      <div className="space-y-3">
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            {task.description}
          </p>
        )}
      </div>

      {/* Checklist section in Focus mode */}
      {task.checklist && task.checklist.length > 0 && (
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <ChecklistEditor
            items={task.checklist}
            onChange={handleChecklistChange}
          />
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 flex items-center gap-3">
        <button
          onClick={() => {
            toggleMutation.mutate({
              id: task.id,
              is_completed: true,
              currentTodo: task,
            });
            onNext();
          }}
          className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>Hoàn Thành Công Việc Này!</span>
        </button>

        {totalTasks > 1 && (
          <button
            onClick={onNext}
            className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
            title="Chuyển task tiếp theo"
          >
            <span>Bỏ qua</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
