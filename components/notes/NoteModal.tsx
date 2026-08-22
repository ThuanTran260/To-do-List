'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NoteEditor } from './NoteEditor';
import { Note } from '@/types/note';

interface NoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NoteModal({ note, isOpen, onClose }: NoteModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen || !note) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9500] flex items-center justify-center p-3 sm:p-6 bg-overlay backdrop-blur-xs">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Modal Editor Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-2xl max-h-[88vh] flex flex-col"
        >
          <NoteEditor
            note={note}
            isModal={true}
            onClose={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
