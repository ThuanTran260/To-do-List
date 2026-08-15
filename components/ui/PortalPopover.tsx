'use client';

import { useState, useEffect, useLayoutEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';

interface PortalPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  maxPopoverHeight?: number;
}

export function PortalPopover({
  isOpen,
  onClose,
  triggerRef,
  children,
  maxPopoverHeight = 240,
}: PortalPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; isFlippedAbove: boolean }>({
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
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const spaceBelow = windowHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Collision detection: Flip above if space below is less than maxPopoverHeight
    const shouldFlip = spaceBelow < maxPopoverHeight && spaceAbove > spaceBelow;

    setCoords({
      top: shouldFlip ? rect.top - 6 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      isFlippedAbove: shouldFlip,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

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
  }, [isOpen, onClose]);

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
            width: `${coords.width}px`,
            zIndex: 9999, // z-portal-popover token
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: coords.isFlippedAbove ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: coords.isFlippedAbove ? 4 : -4 }}
            transition={springPillMotion}
            className="p-1 rounded-lg surface-panel bg-surface-1 border border-hairline shadow-xl space-y-0.5 overflow-hidden text-ink"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
