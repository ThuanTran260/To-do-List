'use client';

import { ReactNode, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function FloatingPanel({ isOpen, onClose, children, className = '' }: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll on mobile when panel is open to prevent iOS scroll-chaining
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || 'unset';
      };
    }
  }, [isOpen, isMobile]);

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

  // Mobile Render via React Portal to document.body (Bypasses Header backdrop-blur-md containing block)
  if (mounted && isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[8999] flex justify-center">
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Viewport-Safe Centered Panel */}
        <div
          ref={panelRef}
          style={{
            animation: 'popoverIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
          className={`fixed inset-x-3 top-16 z-[9000] max-w-sm mx-auto max-h-[85dvh] overflow-y-auto rounded-xl surface-panel bg-surface-1 border border-hairline shadow-2xl p-3.5 space-y-3 ${className}`}
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
      </div>,
      document.body
    );
  }

  // Desktop In-Place Render (Unchanged)
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
