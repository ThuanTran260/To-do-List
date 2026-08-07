'use client';

import { useState } from 'react';
import { useTodos, useToggleTodo } from '@/hooks/useTodos';
import { MotionPage } from '@/components/ui/MotionPage';
import { Target, CheckCircle2, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FocusPage() {
  const { data } = useTodos(1, 100);
  const toggleMutation = useToggleTodo();
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
          <motion.div
            key={currentTask.id}
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
                Task {currentIndex + 1} / {activeTodos.length}
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                {currentTask.title}
              </h3>
              {currentTask.description && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {currentTask.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  toggleMutation.mutate({
                    id: currentTask.id,
                    is_completed: true,
                  });
                  handleNext();
                }}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>Hoàn Thành Công Việc Này!</span>
              </button>

              {activeTodos.length > 1 && (
                <button
                  onClick={handleNext}
                  className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                  title="Chuyển task tiếp theo"
                >
                  <span>Bỏ qua</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
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
