'use client';

import { useTodos } from '@/hooks/useTodos';
import { RealtimeStreakBadge } from '@/components/widget/RealtimeStreakBadge';
import { TrendingUp, CheckCircle2, Clock, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export function InsightsCard() {
  const { data } = useTodos(1, 100);
  const todos = data?.todos || [];
  const total = todos.length;
  const completed = todos.filter((t) => t.is_completed).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const highPriorityCompleted = todos.filter((t) => t.priority === 'high' && t.is_completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      className="p-4 sm:p-5 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-4 shadow-xs"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary-subtle text-primary border border-primary-border">
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-ink">FlowState Insights</h3>
            <p className="text-[11px] text-ink-subtle font-normal">Hiệu suất & Tiến độ công việc</p>
          </div>
        </div>

        {/* Real-time Dynamic Streak Badge */}
        <RealtimeStreakBadge />
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-ink-muted">Tỷ lệ hoàn thành</span>
          <span className="text-primary font-semibold">
            {completionRate}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden border border-hairline">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>

      {/* Analytics Mini Grid */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="p-3 rounded-lg bg-surface-2 border border-hairline flex flex-col items-center justify-center text-center space-y-0.5">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-lg font-semibold text-ink">
            {completed}
          </span>
          <span className="text-[10px] text-ink-subtle font-medium">Đã xong</span>
        </div>

        <div className="p-3 rounded-lg bg-surface-2 border border-hairline flex flex-col items-center justify-center text-center space-y-0.5">
          <Clock className="w-4 h-4 text-warning" />
          <span className="text-lg font-semibold text-ink">
            {total - completed}
          </span>
          <span className="text-[10px] text-ink-subtle font-medium">Cần làm</span>
        </div>

        <div className="p-3 rounded-lg bg-surface-2 border border-hairline flex flex-col items-center justify-center text-center space-y-0.5">
          <Award className="w-4 h-4 text-primary" />
          <span className="text-lg font-semibold text-ink">
            {highPriorityCompleted}
          </span>
          <span className="text-[10px] text-ink-subtle font-medium">Ưu tiên cao</span>
        </div>
      </div>
    </motion.div>
  );
}
