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
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      className="p-6 sm:p-8 rounded-xl surface-panel bg-surface-1 border border-hairline shadow-lg space-y-5 text-left relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <span className="px-2.5 py-1 rounded-md bg-primary-subtle text-primary font-medium text-xs border border-primary-border flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5" />
          <span>Đang Tập Trung</span>
        </span>
        <span className="text-xs text-ink-subtle font-medium">
          Task {currentIndex + 1} / {totalTasks}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-semibold text-ink leading-tight">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed font-normal">
            {task.description}
          </p>
        )}
      </div>

      {/* Checklist section in Focus mode */}
      {task.checklist && task.checklist.length > 0 && (
        <div className="pt-3 border-t border-hairline">
          <ChecklistEditor
            items={task.checklist}
            onChange={handleChecklistChange}
          />
        </div>
      )}

      {/* Actions */}
      <div className="pt-3 flex items-center gap-3">
        <button
          onClick={() => {
            toggleMutation.mutate({
              id: task.id,
              is_completed: true,
              currentTodo: task,
            });
            onNext();
          }}
          className="flex-1 py-2.5 px-5 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>Hoàn Thành Công Việc Này!</span>
        </button>

        {totalTasks > 1 && (
          <button
            onClick={onNext}
            className="py-2.5 px-3.5 rounded-md bg-surface-2 hover:bg-surface-3 text-ink font-medium text-xs border border-hairline transition-colors flex items-center gap-1 cursor-pointer"
            title="Chuyển task tiếp theo"
          >
            <span>Bỏ qua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
