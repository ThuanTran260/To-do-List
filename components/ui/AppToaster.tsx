'use client';

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        className:
          'glass-panel border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 font-sans shadow-2xl rounded-2xl',
        style: {
          padding: '12px 16px',
        },
      }}
    />
  );
}
