'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useTrashTodos, useRestoreTodo, usePermanentDeleteTodo } from '@/hooks/useTodos';
import { deleteTaskImage } from '@/lib/storage';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { RotateCcw, Trash2, Calendar, AlertCircle, Loader2 } from 'lucide-react';
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
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-hairline">
          <p className="text-xs text-ink-subtle">
            Các mục trong thùng rác sẽ tự động được xóa vĩnh viễn sau 30 ngày.
          </p>

          {trashList.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRestoreAllTrash}
                disabled={isBulkProcessing}
                className="px-2.5 py-1 rounded-md bg-primary-subtle text-primary text-xs font-medium hover:bg-primary-subtle/80 transition-colors border border-primary-border disabled:opacity-50 cursor-pointer"
              >
                Khôi phục tất cả
              </button>
              <button
                onClick={handleClearAllTrash}
                disabled={isBulkProcessing}
                className="px-2.5 py-1 rounded-md bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20 transition-colors border border-danger/20 disabled:opacity-50 cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {isBulkProcessing && (
          <div className="p-2.5 rounded-md bg-primary-subtle border border-primary-border text-primary text-xs font-medium flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{bulkStatus || 'Đang xử lý hàng loạt...'}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-8 text-center text-xs text-ink-subtle">Đang tải...</div>
        ) : trashList.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center text-ink-subtle gap-2">
            <AlertCircle className="w-6 h-6 opacity-40" />
            <p className="text-xs font-medium">Thùng rác trống</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trashList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-surface-2 text-ink"
              >
                <div className="space-y-1 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs truncate line-through text-ink-subtle">
                      {item.title}
                    </span>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  {item.deleted_at && (
                    <div className="flex items-center gap-1 text-[10px] text-ink-subtle">
                      <Calendar className="w-3 h-3" />
                      <span>Đã xóa: {new Date(item.deleted_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => restoreMutation.mutate(item.id)}
                    disabled={restoreMutation.isPending || isBulkProcessing}
                    className="p-1.5 rounded-md text-primary hover:bg-primary-subtle transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
                    title="Khôi phục"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
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
                    className="p-1.5 rounded-md text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                    title="Xóa vĩnh viễn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
