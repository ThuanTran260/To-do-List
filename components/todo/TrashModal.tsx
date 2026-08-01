'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useTrashTodos, useRestoreTodo, usePermanentDeleteTodo } from '@/hooks/useTodos';
import { deleteTaskImage } from '@/lib/storage';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { RotateCcw, Trash2, Calendar, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { PriorityBadge } from '@/components/ui/Badge';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrashModal({ isOpen, onClose }: TrashModalProps) {
  const { data: trashList = [], isLoading } = useTrashTodos();
  const restoreMutation = useRestoreTodo();
  const permanentDeleteMutation = usePermanentDeleteTodo();
  const queryClient = useQueryClient();

  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

  const handleClearAllTrash = async () => {
    if (trashList.length === 0) return;
    if (
      !confirm(
        `⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA VĨNH VIỄN ${trashList.length} CÔNG VIỆC TRONG THÙNG RÁC?\n\nHành động này không thể hoàn tác!`
      )
    ) {
      return;
    }

    setIsBulkProcessing(true);
    setBulkStatus('Đang dọn dẹp ảnh storage...');

    try {
      // 1. Delete image attachments from Storage for all trashed items
      for (const item of trashList) {
        if (item.image_url) {
          await deleteTaskImage(item.image_url);
        }
      }

      setBulkStatus('Đang xóa dữ liệu...');
      const supabase = createClient();
      const ids = trashList.map((t) => t.id);

      const { error } = await supabase.from('todos').delete().in('id', ids);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['todos'] });
    } catch (err: any) {
      alert(`Lỗi khi dọn thùng rác: ${err.message}`);
    } finally {
      setIsBulkProcessing(false);
      setBulkStatus('');
    }
  };

  const handleRestoreAllTrash = async () => {
    if (trashList.length === 0) return;
    if (!confirm(`Khôi phục tất cả ${trashList.length} công việc về danh sách hoạt động?`)) {
      return;
    }

    setIsBulkProcessing(true);
    setBulkStatus('Đang khôi phục...');

    try {
      const supabase = createClient();
      const ids = trashList.map((t) => t.id);

      const { error } = await supabase
        .from('todos')
        .update({ deleted_at: null })
        .eq('deleted_at', null)
        .in('id', ids);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['todos'] });
    } catch (err: any) {
      alert(`Lỗi khi khôi phục: ${err.message}`);
    } finally {
      setIsBulkProcessing(false);
      setBulkStatus('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thùng rác Todo">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Các mục trong thùng rác sẽ tự động được xóa vĩnh viễn sau 30 ngày.
          </p>

          {trashList.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRestoreAllTrash}
                disabled={isBulkProcessing}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-800 disabled:opacity-50"
              >
                Khôi phục tất cả
              </button>
              <button
                onClick={handleClearAllTrash}
                disabled={isBulkProcessing}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors border border-rose-500/20 disabled:opacity-50"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {isBulkProcessing && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{bulkStatus || 'Đang xử lý hàng loạt...'}</span>
          </div>
        )}

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
                    disabled={restoreMutation.isPending || isBulkProcessing}
                    className="p-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors text-xs font-medium flex items-center gap-1"
                    title="Khôi phục"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Khôi phục</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Xóa vĩnh viễn mục này?')) {
                        if (item.image_url) {
                          await deleteTaskImage(item.image_url);
                        }
                        permanentDeleteMutation.mutate(item.id);
                      }
                    }}
                    disabled={permanentDeleteMutation.isPending || isBulkProcessing}
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
