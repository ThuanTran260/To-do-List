'use client';

import { createContext, useContext, useEffect, useState, useTransition, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import {
  inspectHardware,
  resolveEffectiveLiteMode,
  getNextPerformanceMode,
  type PerformanceMode,
  type HardwareInspectionResult,
} from '@/lib/hardware/performanceDetector';

export interface PerformanceContextValue {
  mode: PerformanceMode;
  isLiteActive: boolean;
  inspection: HardwareInspectionResult;
  setMode: (mode: PerformanceMode) => void;
  cycleMode: () => void;
}

const defaultInspection: HardwareInspectionResult = {
  isSoftwareRasterizer: false,
  renderer: '',
  vendor: '',
  cores: 4,
  prefersReducedMotion: false,
  isLowEnd: false,
};

const PerformanceContext = createContext<PerformanceContextValue>({
  mode: 'auto',
  isLiteActive: false,
  inspection: defaultInspection,
  setMode: () => {},
  cycleMode: () => {},
});

export interface PerformanceProviderProps {
  children: ReactNode;
  defaultMode?: PerformanceMode;
  storageKey?: string;
}

export function PerformanceProvider({
  children,
  defaultMode = 'auto',
  storageKey = 'flowstate-performance-mode',
}: PerformanceProviderProps) {
  const [mode, setModeState] = useState<PerformanceMode>(defaultMode);
  const [inspection, setInspection] = useState<HardwareInspectionResult>(defaultInspection);
  const [isLiteActive, setIsLiteActive] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // Load saved preference from localStorage and inspect hardware on mount
  useEffect(() => {
    let initialMode: PerformanceMode = defaultMode;
    try {
      const saved = localStorage.getItem(storageKey) as PerformanceMode | null;
      if (saved === 'auto' || saved === 'lite' || saved === 'full') {
        initialMode = saved;
      }
    } catch {
      // LocalStorage might be disabled or restricted
    }

    const detected = inspectHardware();
    setInspection(detected);
    setModeState(initialMode);

    const active = resolveEffectiveLiteMode(initialMode, detected);
    setIsLiteActive(active);

    // Sync HTML class
    if (active) {
      document.documentElement.classList.add('lite-mode');
    } else {
      document.documentElement.classList.remove('lite-mode');
    }
  }, [defaultMode, storageKey]);

  // Listen for OS prefers-reduced-motion changes if in auto mode
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      if (mode === 'auto') {
        const freshInspection = inspectHardware();
        freshInspection.prefersReducedMotion = mql.matches;
        setInspection({ ...freshInspection });
        const active = resolveEffectiveLiteMode('auto', freshInspection);
        setIsLiteActive(active);
        if (active) {
          document.documentElement.classList.add('lite-mode');
        } else {
          document.documentElement.classList.remove('lite-mode');
        }
      }
    };

    mql.addEventListener?.('change', handleChange);
    return () => mql.removeEventListener?.('change', handleChange);
  }, [mode]);

  const setMode = (newMode: PerformanceMode) => {
    startTransition(() => {
      setModeState(newMode);
      try {
        localStorage.setItem(storageKey, newMode);
      } catch {
        // Ignore localStorage errors in private browsing/sandboxes
      }

      const active = resolveEffectiveLiteMode(newMode, inspection);
      setIsLiteActive(active);

      if (active) {
        document.documentElement.classList.add('lite-mode');
      } else {
        document.documentElement.classList.remove('lite-mode');
      }
    });
  };

  const cycleMode = () => {
    const next = getNextPerformanceMode(mode);
    setMode(next);
  };

  return (
    <PerformanceContext.Provider
      value={{
        mode,
        isLiteActive,
        inspection,
        setMode,
        cycleMode,
      }}
    >
      {/* Zero Component Pollution: Framer Motion instantly collapses spring physics across the entire tree */}
      <MotionConfig reducedMotion={isLiteActive ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </PerformanceContext.Provider>
  );
}

export function usePerformance(): PerformanceContextValue {
  return useContext(PerformanceContext);
}
