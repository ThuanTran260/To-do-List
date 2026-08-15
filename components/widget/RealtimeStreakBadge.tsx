'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import { Flame, CheckCircle2, Zap, Target, CalendarDays } from 'lucide-react';

export function RealtimeStreakBadge() {
  const { data } = useTodos(1, 100);
  const todos = data?.todos || [];

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format Date to YYYY-MM-DD in local time
  const getLocalDateString = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // True Consecutive Days Streak Calculation Logic
  const { streakCount, todayCompletedCount, totalCompletedCount, hasDoneToday } = useMemo(() => {
    const completedTodos = todos.filter((t) => t.is_completed);
    const totalDone = completedTodos.length;

    const todayStr = getLocalDateString(new Date());

    // Calculate completed count for today
    let todayCount = 0;
    const completedDatesSet = new Set<string>();

    completedTodos.forEach((t) => {
      // Use updated_at or created_at or fallback to today
      const dateStr = t.updated_at
        ? getLocalDateString(t.updated_at)
        : t.created_at
        ? getLocalDateString(t.created_at)
        : todayStr;

      if (dateStr) {
        completedDatesSet.add(dateStr);
        if (dateStr === todayStr) {
          todayCount++;
        }
      }
    });

    // If no tasks completed at all, streak is 0
    if (totalDone === 0 || completedDatesSet.size === 0) {
      return {
        streakCount: 0,
        todayCompletedCount: 0,
        totalCompletedCount: 0,
        hasDoneToday: false,
      };
    }

    // Check consecutive days starting from today or yesterday
    let streak = 0;
    const todayHasDone = completedDatesSet.has(todayStr);

    let checkDate = new Date();
    if (!todayHasDone) {
      // If not done today yet, check if yesterday was done (grace period)
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = getLocalDateString(checkDate);
      if (!completedDatesSet.has(yesterdayStr)) {
        // Neither today nor yesterday done -> streak reset to 0
        return {
          streakCount: 0,
          todayCompletedCount: todayCount,
          totalCompletedCount: totalDone,
          hasDoneToday: false,
        };
      }
    }

    // Count consecutive days backward
    while (true) {
      const dateKey = getLocalDateString(checkDate);
      if (completedDatesSet.has(dateKey)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      streakCount: streak,
      todayCompletedCount: todayCount,
      totalCompletedCount: totalDone,
      hasDoneToday: todayHasDone,
    };
  }, [todos]);

  return (
    <div ref={containerRef} className="relative">
      {/* Real-time Streak Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
          streakCount > 0
            ? 'bg-success/10 text-success border-success/20'
            : 'bg-surface-2 text-ink-muted border-hairline'
        }`}
        title="Bấm để xem chi tiết Flow Streak"
      >
        <Flame
          className={`w-3.5 h-3.5 ${
            streakCount > 0
              ? 'fill-success text-success'
              : 'text-ink-subtle'
          }`}
        />
        <span>
          Streak: {streakCount} Ngày
        </span>
      </button>

      {/* Real-time Streak Details Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={springPillMotion}
            className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-xl surface-panel bg-surface-1 border border-hairline shadow-xl z-50 space-y-2.5 text-ink"
          >
            <div className="flex items-center justify-between pb-2 border-b border-hairline">
              <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Chi tiết Flow Streak</span>
              </h4>
              <span className="text-[10px] font-medium text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Realtime
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-success/10 border border-success/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-success fill-success" />
                  <span className="text-ink font-medium">Chuỗi liên tục:</span>
                </div>
                <span className="font-semibold text-success text-sm">
                  {streakCount} Ngày 🔥
                </span>
              </div>

              <div className="p-2 rounded-lg bg-surface-2 border border-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-ink-muted font-normal">Hôm nay đã xong:</span>
                </div>
                <span className="font-medium text-ink">
                  {todayCompletedCount} công việc
                </span>
              </div>

              <div className="p-2 rounded-lg bg-surface-2 border border-hairline flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span className="text-ink-muted font-normal">Tổng đã hoàn thành:</span>
                </div>
                <span className="font-medium text-ink">
                  {totalCompletedCount} công việc
                </span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-surface-2 border border-hairline text-[11px] text-ink-subtle font-normal flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>
                {hasDoneToday
                  ? 'Bạn đã hoàn thành công việc hôm nay!'
                  : 'Hoàn thành 1 công việc hôm nay để tăng chuỗi.'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
