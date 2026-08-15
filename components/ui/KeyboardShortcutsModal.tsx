'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcutList = [
    { key: 'Ctrl + K / ⌘K', desc: 'Mở Command Palette (Tìm kiếm & Lệnh nhanh)' },
    { key: 'N', desc: 'Tạo công việc mới (Focus ô nhập)' },
    { key: '/', desc: 'Focus vào thanh Tìm kiếm' },
    { key: '?', desc: 'Mở bảng Phím Tắt này' },
    { key: 'Esc', desc: 'Đóng Modal / Hủy thao tác' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-lg bg-surface-1 rounded-xl border border-hairline shadow-2xl overflow-hidden text-ink"
        >
          {/* Header */}
          <div className="p-4 border-b border-hairline flex items-center justify-between bg-surface-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-primary-subtle text-primary border border-primary-border">
                <Keyboard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-ink flex items-center gap-1.5">
                  Phím Tắt Hệ Thống
                  <Sparkles className="w-3.5 h-3.5 text-warning" />
                </h3>
                <p className="text-xs text-ink-subtle font-normal">
                  Thao tác siêu tốc không cần dùng chuột
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {shortcutList.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2 border border-hairline"
              >
                <span className="text-xs font-medium text-ink-muted">
                  {item.desc}
                </span>
                <kbd className="px-2 py-0.5 rounded bg-surface-1 border border-hairline text-ink font-mono text-xs font-medium shadow-xs">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 bg-surface-2 border-t border-hairline text-center text-xs text-ink-subtle font-normal">
            Mẹo: Bấm <kbd className="font-mono font-medium text-primary">Esc</kbd> để đóng nhanh cửa sổ này
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
