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
    <MotionPage className="max-w-2xl mx-auto space-y-6 text-center pt-4">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-subtle border border-primary-border text-primary text-xs font-medium">
          <Target className="w-3.5 h-3.5" />
          <span>Focus Mode</span>
        </div>
        <h2 className="text-2xl font-semibold text-ink">
          Chỉ 1 Công Việc Tại Một Thời Điểm
        </h2>
        <p className="text-xs text-ink-subtle font-normal">
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
        <div className="p-8 rounded-xl surface-panel bg-surface-1 border border-hairline shadow-xs space-y-3">
          <Sparkles className="w-8 h-8 text-primary mx-auto opacity-70" />
          <h3 className="text-base font-semibold text-ink">
            Tuyệt Vời! Tất Cả Công Việc Đã Hoàn Thành
          </h3>
          <p className="text-xs text-ink-subtle font-normal">
            Không còn task nào cần thực hiện. Hãy tận hưởng thời gian nghỉ ngơi!
          </p>
        </div>
      )}
    </MotionPage>
  );
}
