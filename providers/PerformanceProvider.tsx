'use client';

import { createContext, useContext, useEffect, useState, useTransition, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import {
  inspectHardware,
  resolveFidelityLite,
  resolveMotionReduced,
  getNextPerformanceMode,
  type PerformanceMode,
  type HardwareInspectionResult,
} from '@/lib/hardware/performanceDetector';

export interface PerformanceContextValue {
  mode: PerformanceMode;
  isLiteActive: boolean;
  isFidelityLite: boolean;
  isMotionReduced: boolean;
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
  isFidelityLite: false,
  isMotionReduced: false,
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
  const [isFidelityLite, setIsFidelityLite] = useState<boolean>(false);
  const [isMotionReduced, setIsMotionReduced] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const isLiteActive = isFidelityLite || isMotionReduced;

  // 1. Initial mount: probe hardware and restore saved preference from localStorage
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
    setIsFidelityLite(resolveFidelityLite(initialMode, detected));
    setIsMotionReduced(resolveMotionReduced(initialMode, detected));
  }, [defaultMode, storageKey]);

  // 2. Synchronize .lite-mode class strictly based on isFidelityLite with unmount cleanup
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isFidelityLite) {
      document.documentElement.classList.add('lite-mode');
    } else {
      document.documentElement.classList.remove('lite-mode');
    }

    return () => {
      document.documentElement.classList.remove('lite-mode');
    };
  }, [isFidelityLite]);

  // 3. Listen for OS prefers-reduced-motion media query changes (updates motion axis only)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      const freshInspection: HardwareInspectionResult = {
        ...inspectHardware(),
        prefersReducedMotion: mql.matches,
      };
      setInspection(freshInspection);

      if (mode === 'auto') {
        setIsMotionReduced(resolveMotionReduced('auto', freshInspection));
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

      setIsFidelityLite(resolveFidelityLite(newMode, inspection));
      setIsMotionReduced(resolveMotionReduced(newMode, inspection));
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
        isFidelityLite,
        isMotionReduced,
        inspection,
        setMode,
        cycleMode,
      }}
    >
      {/* Zero Component Pollution: Framer Motion collapses spring physics based strictly on isMotionReduced */}
      <MotionConfig reducedMotion={isMotionReduced ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </PerformanceContext.Provider>
  );
}

export function usePerformance(): PerformanceContextValue {
  return useContext(PerformanceContext);
}
