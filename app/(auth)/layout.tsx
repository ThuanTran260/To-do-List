import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-canvas text-ink relative">
      <div className="z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}
