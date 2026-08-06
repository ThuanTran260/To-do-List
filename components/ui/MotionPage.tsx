'use client';

import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

interface MotionPageProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function MotionPage({ children, className = '', delay = 0, ...props }: MotionPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={{
        type: 'spring',
        damping: 24,
        stiffness: 320,
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 22,
      stiffness: 300,
    },
  },
};
