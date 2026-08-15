'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-overlay backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container with max-h-[85dvh] and flex layout */}
      <div
        className={`relative w-full ${maxWidth} max-h-[85dvh] flex flex-col overflow-hidden rounded-xl shadow-2xl transition-all duration-200 border border-hairline bg-surface-1 text-ink z-[9500]`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hairline flex-shrink-0">
          <h3 className="text-sm sm:text-base font-semibold text-ink">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Children Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 no-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
