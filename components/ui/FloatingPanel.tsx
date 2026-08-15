'use client';

import { ReactNode, useRef, useEffect } from 'react';

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
        animation: 'popoverIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      className={`absolute right-0 top-full mt-1.5 z-50 rounded-xl surface-panel bg-surface-1 border border-hairline shadow-xl ${className}`}
    >
      <style jsx>{`
        @keyframes popoverIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
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
