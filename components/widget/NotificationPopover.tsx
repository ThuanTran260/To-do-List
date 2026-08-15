'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTodos, useToggleTodo } from '@/hooks/useTodos';
import { useDropdownManager } from '@/hooks/useDropdownManager';
import { FloatingPanel } from '@/components/ui/FloatingPanel';
import { Bell, AlertOctagon, Clock, Check, EyeOff, Sparkles, CheckCheck, Eye } from 'lucide-react';

function NotificationPopoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const handleOpenTaskDetail = (id: string) => {
    closeAll();
    const params = new URLSearchParams(searchParams.toString());
    params.set('task', id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

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
        className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 border border-hairline relative transition-colors cursor-pointer"
        title="Thông báo"
      >
        <Bell className="w-4 h-4 text-warning" />
        {totalUnread > 0 && (
          <span className="w-2 h-2 rounded-full bg-danger absolute top-1 right-1" />
        )}
      </button>

      <FloatingPanel isOpen={isOpen} onClose={closeAll} className="w-80 sm:w-96 p-3.5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-warning" />
            <h3 className="text-xs font-semibold text-ink">
              Thông Báo Việc Quan Trọng ({totalUnread})
            </h3>
          </div>
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] font-medium text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Đọc tất cả</span>
            </button>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-2 rounded-md bg-surface-2 text-ink text-xs flex items-center justify-between shadow-xs border border-hairline">
            <span className="truncate">{toastMessage}</span>
            <button
              onClick={handleUndo}
              className="text-[11px] font-medium text-warning hover:underline ml-2 flex-shrink-0 cursor-pointer"
            >
              Hoàn tác
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-danger uppercase tracking-wider flex items-center gap-1">
                <AlertOctagon className="w-3 h-3" />
                <span>Quá hạn ({overdueTasks.length})</span>
              </p>
              {overdueTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded-lg bg-danger/10 border border-danger/20 text-xs flex items-center justify-between gap-2"
                >
                  <div
                    onClick={() => handleOpenTaskDetail(t.id)}
                    className="min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="font-medium text-ink truncate flex items-center gap-1">
                      <span>{t.title}</span>
                      <Eye className="w-3 h-3 text-primary flex-shrink-0" />
                    </p>
                    <p className="text-[10px] text-danger font-normal">
                      Hạn: {new Date(t.due_date!).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: t.id, is_completed: true, currentTodo: t })}
                      className="p-1 rounded bg-success text-white hover:bg-success/90 transition-colors cursor-pointer"
                      title="Đã xong"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDismiss(t.id, t.title)}
                      className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                      title="Ẩn thông báo"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Due Soon Section */}
          {dueSoonTasks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-warning uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Sắp đến hạn 24h ({dueSoonTasks.length})</span>
              </p>
              {dueSoonTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded-lg bg-warning/10 border border-warning/20 text-xs flex items-center justify-between gap-2"
                >
                  <div
                    onClick={() => handleOpenTaskDetail(t.id)}
                    className="min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="font-medium text-ink truncate flex items-center gap-1">
                      <span>{t.title}</span>
                      <Eye className="w-3 h-3 text-primary flex-shrink-0" />
                    </p>
                    <p className="text-[10px] text-warning font-normal">
                      Hạn: {new Date(t.due_date!).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: t.id, is_completed: true, currentTodo: t })}
                      className="p-1 rounded bg-success text-white hover:bg-success/90 transition-colors cursor-pointer"
                      title="Đã xong"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDismiss(t.id, t.title)}
                      className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
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
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Việc quan trọng ({vitalTasks.length})</span>
              </p>
              {vitalTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded-lg bg-primary-subtle border border-primary-border text-xs flex items-center justify-between gap-2"
                >
                  <div
                    onClick={() => handleOpenTaskDetail(t.id)}
                    className="min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <p className="font-medium text-ink truncate flex items-center gap-1">
                      <span>{t.title}</span>
                      <Eye className="w-3 h-3 text-primary flex-shrink-0" />
                    </p>
                    <p className="text-[10px] text-primary font-normal">Ưu tiên Cao</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: t.id, is_completed: true, currentTodo: t })}
                      className="p-1 rounded bg-success text-white hover:bg-success/90 transition-colors cursor-pointer"
                      title="Đã xong"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDismiss(t.id, t.title)}
                      className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
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
            <div className="py-6 text-center text-xs text-ink-subtle space-y-1">
              <CheckCheck className="w-7 h-7 mx-auto text-success opacity-80" />
              <p className="font-medium text-ink">Không có thông báo mới</p>
              <p className="text-[11px]">Tất cả các công việc quan trọng đều đã ổn thỏa!</p>
            </div>
          )}
        </div>
      </FloatingPanel>
    </div>
  );
}

export function NotificationPopover() {
  return (
    <Suspense fallback={null}>
      <NotificationPopoverContent />
    </Suspense>
  );
}
