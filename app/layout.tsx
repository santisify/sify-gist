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
};

// 添加一个内联脚本来防止主题闪烁
const themeScript = `
  (function() {
    try {
      // 从 localStorage 获取用户首选主题
      const storedTheme = localStorage.getItem('theme');
      
      if (storedTheme) {
        // 如果有存储的主题，直接应用
        if (storedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        // 如果没有存储的主题，检查系统偏好
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (e) {
      // 如果出现错误，什么都不做，让JS版本的主题上下文来处理
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <main>
              {children}
            </main>
            <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-8 py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} Sify Gist - 代码片段分享平台
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}