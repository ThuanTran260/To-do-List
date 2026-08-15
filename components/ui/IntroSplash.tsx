'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';

interface IntroSplashProps {
  children: React.ReactNode;
}

export function IntroSplash({ children }: IntroSplashProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if intro has already been shown in current browser session
    const hasSeenIntro = typeof window !== 'undefined' ? sessionStorage.getItem('flowstate_intro_seen') : null;

    if (hasSeenIntro) {
      setShowSplash(false);
      return;
    }

    // Animate progress bar from 0 to 100%
    const startTime = Date.now();
    const duration = 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(() => {
          setShowSplash(false);
          try {
            sessionStorage.setItem('flowstate_intro_seen', 'true');
          } catch {}
        }, 150);
      }
    }, 16);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="intro-splash-overlay"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-canvas text-ink overflow-hidden select-none"
          >
            {/* Central Brand Icon */}
            <div className="relative z-10 flex flex-col items-center space-y-5">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 22,
                  delay: 0.1,
                }}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-md">
                  <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.5]" />
                </div>
              </motion.div>

              {/* Brand Title */}
              <div className="text-center space-y-1">
                <motion.h1
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
                  className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink"
                >
                  Flow State
                </motion.h1>

                <motion.p
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.35, ease: 'easeOut' }}
                  className="text-xs text-ink-subtle font-medium tracking-wide flex items-center gap-1.5 justify-center"
                >
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span>Productivity OS</span>
                </motion.p>
              </div>

              {/* Progress Bar Container */}
              <motion.div
                initial={{ opacity: 0, width: 80 }}
                animate={{ opacity: 1, width: 200 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="pt-3 flex flex-col items-center gap-2"
              >
                <div className="w-full h-1 rounded-full bg-surface-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between w-full text-[10px] font-medium text-ink-subtle uppercase tracking-widest px-0.5">
                  <span>Loading</span>
                  <span>{progress}%</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Reveal Animation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: showSplash ? 0.15 : 0, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
