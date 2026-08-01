'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type PanelType = 'search' | 'calendar' | 'notifications' | null;

interface DropdownManagerContextType {
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  togglePanel: (panel: PanelType) => void;
  closeAll: () => void;
}

const DropdownManagerContext = createContext<DropdownManagerContextType>({
  activePanel: null,
  setActivePanel: () => null,
  togglePanel: () => null,
  closeAll: () => null,
});

export function DropdownManagerProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  const closeAll = () => setActivePanel(null);

  const togglePanel = (panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <DropdownManagerContext.Provider
      value={{ activePanel, setActivePanel, togglePanel, closeAll }}
    >
      {children}
    </DropdownManagerContext.Provider>
  );
}

export function useDropdownManager() {
  return useContext(DropdownManagerContext);
}
