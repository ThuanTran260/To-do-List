'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { useTrashNotes, useRestoreNote, usePermanentDeleteNote } from '@/hooks/useNotes';
import { extractPlainText } from '@/lib/textHighlight';
import { toast } from 'sonner';

interface NoteTrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NoteTrashModal({ isOpen, onClose }: NoteTrashModalProps) {
  const [mounted, setMounted] = useState(false);
  const { data: trashNotes = [], isLoading } = useTrashNotes(isOpen);

  const restoreMutation = useRestoreNote();
  const permanentDeleteMutation = usePermanentDeleteNote();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Đã khôi phục ghi chú');
      },
    });
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn ghi chú này?')) {
      permanentDeleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success('Đã xóa vĩnh viễn');
        },
      });
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9500] flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="relative z-10 w-full max-w-xl max-h-[80vh] bg-surface-1 border border-hairline rounded-2xl shadow-2xl flex flex-col overflow-hidden text-ink"
        >
          {/* Modal Header */}
          <div className="p-4 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-danger/10 text-danger">
                <Trash2 className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-sm sm:text-base text-ink">
                Thùng rác ghi chú
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content List */}
          <div className="p-4 flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-ink-subtle">
                Đang tải thùng rác...
              </div>
            ) : trashNotes.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-medium text-ink-muted">
                  Thùng rác đang trống
                </p>
                <p className="text-xs text-ink-subtle">
                  Các ghi chú bị xóa sẽ lưu tại đây trước khi tự động dọn dẹp sau 30 ngày.
                </p>
              </div>
            ) : (
              trashNotes.map((note) => {
                const plainText = extractPlainText(note.content);
                return (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl border border-hairline bg-surface-2/40 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-xs sm:text-sm text-ink truncate">
                        {note.title || 'Ghi chú không có tiêu đề'}
                      </h4>
                      {plainText && (
                        <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                          {plainText}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestore(note.id)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary-subtle border border-primary-border transition-colors flex items-center gap-1 cursor-pointer"
                        title="Khôi phục ghi chú"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Khôi phục</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePermanentDelete(note.id)}
                        className="p-1.5 rounded-md text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 bg-surface-2/60 border-t border-hairline flex items-center justify-between text-xs text-ink-subtle">
            <span>{trashNotes.length} ghi chú trong thùng rác</span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-ink font-medium transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
