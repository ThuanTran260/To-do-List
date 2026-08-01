'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { liquidPageMotion } from '@/lib/motion';

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={liquidPageMotion.initial}
        animate={liquidPageMotion.animate}
        exit={liquidPageMotion.exit}
        transition={liquidPageMotion.transition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
