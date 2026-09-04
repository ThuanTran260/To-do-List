'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';

interface PortalPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  maxPopoverHeight?: number;
  align?: 'start' | 'end' | 'auto';
  className?: string;
}

export function PortalPopover({
  isOpen,
  onClose,
  triggerRef,
  children,
  maxPopoverHeight = 280,
  align = 'auto',
  className = '',
}: PortalPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    isFlippedAbove: boolean;
  }>({
    top: 0,
    left: 0,
    width: 0,
    isFlippedAbove: false,
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update positioning & collision detection
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    const spaceBelow = windowHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Vertical collision detection
    const shouldFlip = spaceBelow < maxPopoverHeight && spaceAbove > spaceBelow;

    // Horizontal collision detection & alignment
    const popoverWidth = popoverRef.current?.offsetWidth || 192;
    const spaceRight = windowWidth - rect.left;
    const isAlignEnd = align === 'end' || (align !== 'start' && spaceRight < popoverWidth + 16);

    let left = isAlignEnd ? rect.right - popoverWidth : rect.left;

    // Viewport padding clamping (12px minimum from edges)
    const padding = 12;
    if (left < padding) left = padding;
    if (left + popoverWidth > windowWidth - padding) {
      left = windowWidth - popoverWidth - padding;
    }

    setCoords({
      top: shouldFlip ? rect.top - 6 : rect.bottom + 4,
      left,
      width: rect.width,
      isFlippedAbove: shouldFlip,
    });
  }, [align, maxPopoverHeight, triggerRef]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Event listeners for window scroll, resize, and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, updatePosition, triggerRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: coords.isFlippedAbove ? undefined : `${coords.top}px`,
            bottom: coords.isFlippedAbove ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
            zIndex: 9999, // z-portal-popover token
            width: 'max-content',
            maxWidth: 'calc(100vw - 24px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: coords.isFlippedAbove ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: coords.isFlippedAbove ? 4 : -4 }}
            transition={springPillMotion}
            className={`p-1 rounded-lg surface-panel bg-surface-1 border border-hairline shadow-xl space-y-0.5 text-ink ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
