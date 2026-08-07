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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  Phím Tắt Hệ Thống
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Thao tác siêu tốc không cần dùng chuột
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
            {shortcutList.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800"
              >
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {item.desc}
                </span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold shadow-sm">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            Mẹo: Bấm <kbd className="font-mono font-bold text-indigo-500">Esc</kbd> để đóng nhanh cửa sổ này
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
