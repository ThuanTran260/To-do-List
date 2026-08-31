import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import QueryProvider from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { DropdownManagerProvider } from '@/hooks/useDropdownManager';
import { IntroSplash } from '@/components/ui/IntroSplash';
import { AppToaster } from '@/components/ui/AppToaster';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Flow State — Quản Lý Công Việc Thông Minh',
  description: 'Ứng dụng Todo List thông minh với bảo mật Supabase RLS, Realtime sync và hiệu ứng tối ưu.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // MD-10: passthrough nonce từ middleware để Next.js gắn vào script/style inline
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html
      lang="vi"
      nonce={nonce}
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased selection:bg-primary selection:text-white">
        <ThemeProvider defaultTheme="dark" storageKey="flowstate-theme">
          <QueryProvider>
            <DropdownManagerProvider>
              <IntroSplash>{children}</IntroSplash>
              <AppToaster />
            </DropdownManagerProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
