'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trash2, X, AlertCircle, ArrowUpCircle } from 'lucide-react';
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
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-xl border border-slate-700/50 shadow-2xl"
      >
        <span className="text-sm font-semibold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
          {count} đã chọn
        </span>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <button
          onClick={handleComplete}
          disabled={bulkComplete.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Hoàn thành</span>
        </button>

        <div className="relative group">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 text-xs font-medium transition-colors"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Đổi ưu tiên</span>
          </button>
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex flex-col bg-slate-800 border border-slate-700 rounded-lg p-1 shadow-lg gap-1">
            <button
              onClick={() => handleSetPriority('high')}
              className="px-3 py-1 text-xs text-rose-400 hover:bg-slate-700 rounded text-left"
            >
              🔥 Cao
            </button>
            <button
              onClick={() => handleSetPriority('medium')}
              className="px-3 py-1 text-xs text-amber-400 hover:bg-slate-700 rounded text-left"
            >
              ⚡ Trung bình
            </button>
            <button
              onClick={() => handleSetPriority('low')}
              className="px-3 py-1 text-xs text-blue-400 hover:bg-slate-700 rounded text-left"
            >
              ☕ Thấp
            </button>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={bulkDelete.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Xóa</span>
        </button>

        <button
          onClick={onClearSelection}
          className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-2"
          title="Bỏ chọn"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
