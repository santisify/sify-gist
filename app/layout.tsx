// app/layout.tsx
import './styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from './navbar';
import { ThemeProvider } from '@/lib/theme-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sify Gist - 代码片段分享平台',
  description: '一个简单的代码片段分享平台，类似于 GitHub Gist',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
};

// 添加一个内联脚本来防止主题闪烁
const themeScript = `
  (function() {
    try {
      const storedTheme = localStorage.getItem('theme');
      
      if (storedTheme) {
        if (storedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (e) {
      // 如果出现错误，什么都不做
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 py-6">
              {children}
            </main>
            <footer className="border-t py-6" style={{ borderColor: 'var(--color-border)' }}>
              <div className="container-main text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="text-sm">Powered by Sify Gist</span>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
