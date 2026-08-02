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

    // Sort unique dates descending
    const sortedDates = Array.from(completedDatesSet).sort().reverse();

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
      {/* Real-time Streak Badge Button (No time, pure Streak Days) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform cursor-pointer ${
          streakCount > 0
            ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-indigo-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
        }`}
        title="Bấm để xem chi tiết Flow Streak"
      >
        <span className="relative flex items-center justify-center">
          <Flame
            className={`w-4 h-4 ${
              streakCount > 0
                ? 'fill-emerald-500 text-emerald-500 dark:fill-emerald-400 animate-pulse'
                : 'text-slate-400'
            }`}
          />
          {streakCount > 0 && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-40 animate-ping" />
          )}
        </span>
        <span className="font-extrabold">
          Flow Streak: {streakCount} Ngày
        </span>
      </button>

      {/* Real-time Streak Details Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={springPillMotion}
            className="absolute right-0 top-full mt-2 w-72 p-4 rounded-3xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl z-50 space-y-3 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Chi tiết Chuỗi Flow Streak</span>
              </h4>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Realtime
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-bold">Chuỗi liên tục:</span>
                </div>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {streakCount} Ngày 🔥
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Hôm nay đã xong:</span>
                </div>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                  {todayCompletedCount} công việc
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Tổng đã hoàn thành:</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {totalCompletedCount} công việc
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>
                {hasDoneToday
                  ? '✨ Bạn đã hoàn thành công việc hôm nay và duy trì chuỗi Streak!'
                  : '⚡ Hoàn thành 1 công việc hôm nay để bắt đầu/tăng chuỗi Streak.'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
