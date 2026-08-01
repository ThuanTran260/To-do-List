'use client';

import { useState } from 'react';
import { useTodos, useToggleTodo } from '@/hooks/useTodos';
import { useDropdownManager } from '@/hooks/useDropdownManager';
import { FloatingPanel } from '@/components/ui/FloatingPanel';
import { Bell, AlertOctagon, Clock, Check, EyeOff, Sparkles, CheckCheck } from 'lucide-react';

export function NotificationPopover() {
  const { activePanel, togglePanel, closeAll } = useDropdownManager();
  const isOpen = activePanel === 'notifications';

  const { data } = useTodos(1, 100);
  const todos = data?.todos || [];
  const toggleMutation = useToggleTodo();

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastDismissedId, setLastDismissedId] = useState<string | null>(null);

  const now = new Date();

  // Categorize notifications
  const overdueTasks = todos.filter((t) => {
    if (t.is_completed || !t.due_date || dismissedIds.includes(t.id)) return false;
    return new Date(t.due_date) < now;
  });

  const dueSoonTasks = todos.filter((t) => {
    if (t.is_completed || !t.due_date || dismissedIds.includes(t.id)) return false;
    const due = new Date(t.due_date);
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 24;
  });

  const vitalTasks = todos.filter((t) => {
    if (t.is_completed || dismissedIds.includes(t.id)) return false;
    return t.priority === 'high' || t.is_vital;
  });

  const totalUnread = overdueTasks.length + dueSoonTasks.length + vitalTasks.length;

  const handleDismiss = (id: string, title: string) => {
    setDismissedIds((prev) => [...prev, id]);
    setLastDismissedId(id);
    setToastMessage(`Đã ẩn: "${title.slice(0, 20)}..."`);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleUndo = () => {
    if (lastDismissedId) {
      setDismissedIds((prev) => prev.filter((i) => i !== lastDismissedId));
      setLastDismissedId(null);
      setToastMessage(null);
    }
  };

  const handleMarkAllRead = () => {
    const allIds = [...overdueTasks, ...dueSoonTasks, ...vitalTasks].map((t) => t.id);
    setDismissedIds((prev) => [...prev, ...allIds]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => togglePanel('notifications')}
        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 relative transition-colors"
        title="Thông báo"
      >
        <Bell className="w-4 h-4 text-amber-500" />
        {totalUnread > 0 && (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5 animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
          </>
        )}
      </button>

      <FloatingPanel isOpen={isOpen} onClose={closeAll} className="w-80 sm:w-96 p-4 space-y-3">
        {/* Header Bulk Action */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Thông Báo Việc Quan Trọng ({totalUnread})
            </h3>
          </div>
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Đọc tất cả</span>
            </button>
          )}
        </div>

        {/* Undo Toast Banner */}
        {toastMessage && (
          <div className="p-2.5 rounded-xl bg-slate-800 text-white text-xs flex items-center justify-between shadow-lg">
            <span className="truncate">{toastMessage}</span>
            <button
              onClick={handleUndo}
              className="text-[11px] font-bold text-amber-400 hover:underline ml-2 flex-shrink-0"
            >
              Hoàn tác
            </button>
          </div>
        )}

        <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
          {/* Overdue Tasks Section */}
          {overdueTasks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                <AlertOctagon className="w-3 h-3" />
                <span>🔴 Đã quá hạn ({overdueTasks.length})</span>
              </p>
              {overdueTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{t.title}</p>
                    <p className="text-[10px] text-rose-500 font-medium">Hạn: {new Date(t.due_date!).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: t.id, is_completed: true })}
                      className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
                      title="Đã xong"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDismiss(t.id, t.title)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Ẩn thông báo"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Due Soon Tasks Section */}
          {dueSoonTasks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>🟡 Sắp đến hạn trong 24h ({dueSoonTasks.length})</span>
              </p>
              {dueSoonTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{t.title}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Hạn: {new Date(t.due_date!).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: t.id, is_completed: true })}
                      className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
                      title="Đã xong"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDismiss(t.id, t.title)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Ẩn thông báo"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vital Tasks Section */}
          {vitalTasks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>⭐ Công việc quan trọng (Vital Tasks) ({vitalTasks.length})</span>
              </p>
              {vitalTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{t.title}</p>
                    <p className="text-[10px] text-indigo-500 font-medium">Ưu tiên Cao</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: t.id, is_completed: true })}
                      className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
                      title="Đã xong"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDismiss(t.id, t.title)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Ẩn thông báo"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalUnread === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <CheckCheck className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Không có thông báo mới</p>
              <p className="text-[11px]">Tất cả các công việc quan trọng đều đã ổn thỏa!</p>
            </div>
          )}
        </div>
      </FloatingPanel>
    </div>
  );
}
