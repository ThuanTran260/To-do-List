import type { Metadata } from 'next';
import QueryProvider from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { DropdownManagerProvider } from '@/hooks/useDropdownManager';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flow State — Quản Lý Công Việc Thông Minh',
  description: 'Ứng dụng Todo List thông minh với bảo mật Supabase RLS, Realtime sync và hiệu ứng tối ưu.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        <ThemeProvider defaultTheme="dark" storageKey="flowstate-theme">
          <QueryProvider>
            <DropdownManagerProvider>{children}</DropdownManagerProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
