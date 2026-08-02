'use client';

import { useTodos } from '@/hooks/useTodos';
import { RealtimeStreakBadge } from '@/components/widget/RealtimeStreakBadge';
import { TrendingUp, CheckCircle2, Clock, Award } from 'lucide-react';

export function InsightsCard() {
  const { data } = useTodos(1, 100);
  const todos = data?.todos || [];
  const total = todos.length;
  const completed = todos.filter((t) => t.is_completed).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const highPriorityCompleted = todos.filter((t) => t.priority === 'high' && t.is_completed).length;

  return (
    <div className="p-5 rounded-3xl glass-panel bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-xl transition-all">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20 shadow-sm">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">FlowState Insights</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Hiệu suất & Tiến độ công việc</p>
          </div>
        </div>

        {/* Real-time Dynamic Streak Badge */}
        <RealtimeStreakBadge />
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-400">Tỷ lệ hoàn thành</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{completionRate}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/70 dark:border-slate-700/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 dark:to-emerald-400 transition-all duration-500 shadow-sm shadow-indigo-500/30"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Analytics Mini Grid */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-0.5 transition-colors">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{completed}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Đã xong</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-0.5 transition-colors">
          <Clock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{total - completed}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Cần làm</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-0.5 transition-colors">
          <Award className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
          <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{highPriorityCompleted}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Ưu tiên cao</span>
        </div>
      </div>
    </div>
  );
}
