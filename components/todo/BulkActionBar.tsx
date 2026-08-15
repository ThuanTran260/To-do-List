'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trash2, X, ArrowUpCircle } from 'lucide-react';
import { useBulkActions } from '@/hooks/useTodos';
import { toast } from 'sonner';

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export function BulkActionBar({ selectedIds, onClearSelection }: BulkActionBarProps) {
  const { bulkComplete, bulkDelete, bulkPriority } = useBulkActions();
  const count = selectedIds.length;

  if (count === 0) return null;

  const handleComplete = async () => {
    try {
      await bulkComplete.mutateAsync(selectedIds);
      toast.success(`Đã hoàn thành ${count} công việc`);
      onClearSelection();
    } catch {
      toast.error('Lỗi khi cập nhật danh sách công việc');
    }
  };

  const handleDelete = async () => {
    try {
      await bulkDelete.mutateAsync(selectedIds);
      toast.success(`Đã chuyển ${count} công việc vào thùng rác`);
      onClearSelection();
    } catch {
      toast.error('Lỗi khi xóa công việc');
    }
  };

  const handleSetPriority = async (priority: 'low' | 'medium' | 'high') => {
    try {
      await bulkPriority.mutateAsync({ ids: selectedIds, priority });
      toast.success(`Đã cập nhật mức ưu tiên cho ${count} công việc`);
      onClearSelection();
    } catch {
      toast.error('Lỗi khi đổi độ ưu tiên');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-2 text-ink border border-hairline shadow-2xl backdrop-blur-md"
      >
        <span className="text-xs font-semibold bg-primary-subtle text-primary px-2.5 py-0.5 rounded-md border border-primary-border">
          {count} đã chọn
        </span>

        <div className="h-4 w-px bg-hairline mx-0.5" />

        <button
          onClick={handleComplete}
          disabled={bulkComplete.isPending}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-success/10 text-success text-xs font-medium transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Hoàn thành</span>
        </button>

        <div className="relative group">
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-warning/10 text-warning text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Đổi ưu tiên</span>
          </button>
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex flex-col bg-surface-1 border border-hairline rounded-lg p-1 shadow-lg gap-0.5 min-w-[110px]">
            <button
              onClick={() => handleSetPriority('high')}
              className="px-2.5 py-1 text-xs text-danger hover:bg-surface-2 rounded text-left font-medium cursor-pointer"
            >
              🔥 Cao
            </button>
            <button
              onClick={() => handleSetPriority('medium')}
              className="px-2.5 py-1 text-xs text-warning hover:bg-surface-2 rounded text-left font-medium cursor-pointer"
            >
              ⚡ Trung bình
            </button>
            <button
              onClick={() => handleSetPriority('low')}
              className="px-2.5 py-1 text-xs text-success hover:bg-surface-2 rounded text-left font-medium cursor-pointer"
            >
              ☕ Thấp
            </button>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={bulkDelete.isPending}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-danger/10 text-danger text-xs font-medium transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa</span>
        </button>

        <button
          onClick={onClearSelection}
          className="p-1 rounded-md hover:bg-surface-3 text-ink-subtle hover:text-ink transition-colors ml-1 cursor-pointer"
          title="Bỏ chọn"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
