'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, Zap } from 'lucide-react';

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
    const duration = 1200; // 1.2 seconds smooth load

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
        }, 200);
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
              scale: 1.04,
              filter: 'blur(10px)',
              transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            }}
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden select-none"
          >
            {/* Ambient Background Glows */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 1], opacity: [0.3, 0.6, 0.4] }}
              transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
              className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-violet-600/20 to-purple-600/30 blur-[120px] pointer-events-none"
            />

            {/* Central Brand Icon & Glow */}
            <div className="relative z-10 flex flex-col items-center space-y-6">
              <motion.div
                initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
                className="relative"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 border border-indigo-400/30">
                  <CheckCircle2 className="w-11 h-11 sm:w-13 sm:h-13 stroke-[2.5]" />
                </div>
                <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-bounce" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-indigo-400 blur-sm animate-ping" />
              </motion.div>

              {/* Brand Title */}
              <div className="text-center space-y-1.5">
                <motion.h1
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
                  className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent drop-shadow-sm"
                >
                  Flow State
                </motion.h1>

                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.45, ease: 'easeOut' }}
                  className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide flex items-center gap-1.5 justify-center"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Focus & Productivity System</span>
                </motion.p>
              </div>

              {/* Progress Bar Container */}
              <motion.div
                initial={{ opacity: 0, width: 80 }}
                animate={{ opacity: 1, width: 220 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="pt-4 flex flex-col items-center gap-2"
              >
                <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/50 relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full shadow-lg shadow-indigo-500/50"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between w-full text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-0.5">
                  <span>Loading system</span>
                  <span>{progress}%</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Reveal Animation */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: showSplash ? 0.2 : 0, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
