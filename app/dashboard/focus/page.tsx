'use client';

import { useState } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { MotionPage } from '@/components/ui/MotionPage';
import { Target, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { FocusTask } from '@/components/focus/FocusTask';

export default function FocusPage() {
  const { data } = useTodos(1, 100);
  const todos = data?.todos || [];

  const activeTodos = todos.filter((t) => !t.is_completed);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTask = activeTodos[currentIndex] || activeTodos[0];

  const handleNext = () => {
    if (activeTodos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeTodos.length);
  };

  return (
    <MotionPage className="max-w-2xl mx-auto space-y-8 text-center pt-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
          <Target className="w-3.5 h-3.5" />
          <span>Focus Mode — Tối Đa Hóa Tập Trung</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">
          Chỉ 1 Công Việc Tại Một Thời Điểm
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Loại bỏ mọi xao nhãng và hoàn thành từng việc với sự tập trung tuyệt đối
        </p>
      </div>

      {/* Main Focus Card */}
      {currentTask ? (
        <AnimatePresence mode="wait">
          <FocusTask
            task={currentTask}
            currentIndex={currentIndex}
            totalTasks={activeTodos.length}
            onNext={handleNext}
          />
        </AnimatePresence>
      ) : (
        <div className="p-12 rounded-3xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Tuyệt Vời! Tất Cả Công Việc Đã Hoàn Thành
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Không còn task nào cần thực hiện. Hãy tận hưởng thời gian nghỉ ngơi!
          </p>
        </div>
      )}
    </MotionPage>
  );
}
