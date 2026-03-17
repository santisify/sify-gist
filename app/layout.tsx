// app/layout.tsx
import './styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from './navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sify Gist - 代码片段分享平台',
  description: '一个简单的代码片段分享平台，类似于 GitHub Gist',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            {children}
          </main>
          <footer className="bg-white border-t mt-8 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Sify Gist - 代码片段分享平台
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}