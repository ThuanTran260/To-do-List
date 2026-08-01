'use client';

import { ReactNode, useRef, useEffect } from 'react';
import { popoverMotion } from '@/lib/motion';

interface FloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function FloatingPanel({ isOpen, onClose, children, className = '' }: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      style={{
        animation: 'popoverIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      className={`absolute right-0 top-full mt-2 z-50 rounded-2xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-2xl ${className}`}
    >
      <style jsx>{`
        @keyframes popoverIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      {children}
    </div>
  );
}
