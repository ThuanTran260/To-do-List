'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container with max-h-[85dvh] and flex layout */}
      <div
        className={`relative w-full ${maxWidth} max-h-[85dvh] flex flex-col overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 z-[9500] backdrop-blur-xl`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Children Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
