'use client';

import { Modal } from '@/components/ui/Modal';
import { useTrashTodos, useRestoreTodo, usePermanentDeleteTodo } from '@/hooks/useTodos';
import { RotateCcw, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { PriorityBadge } from '@/components/ui/Badge';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrashModal({ isOpen, onClose }: TrashModalProps) {
  const { data: trashList = [], isLoading } = useTrashTodos();
  const restoreMutation = useRestoreTodo();
  const permanentDeleteMutation = usePermanentDeleteTodo();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thùng rác Todo">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Các mục trong thùng rác sẽ tự động được xóa vĩnh viễn sau 30 ngày.
        </p>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-slate-400">Đang tải...</div>
        ) : trashList.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
            <AlertCircle className="w-8 h-8 opacity-40" />
            <p className="text-sm font-medium">Thùng rác trống</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {trashList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200"
              >
                <div className="space-y-1 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate line-through text-slate-500">
                      {item.title}
                    </span>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  {item.deleted_at && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>Đã xóa: {new Date(item.deleted_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => restoreMutation.mutate(item.id)}
                    disabled={restoreMutation.isPending}
                    className="p-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors text-xs font-medium flex items-center gap-1"
                    title="Khôi phục"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Khôi phục</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Xóa vĩnh viễn mục này?')) {
                        permanentDeleteMutation.mutate(item.id);
                      }
                    }}
                    disabled={permanentDeleteMutation.isPending}
                    className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Xóa vĩnh viễn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
