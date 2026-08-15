'use client';

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        className:
          'surface-panel border border-hairline bg-surface-1 text-ink font-sans shadow-lg rounded-lg text-xs',
        style: {
          padding: '10px 14px',
        },
      }}
    />
  );
}
