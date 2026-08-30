import './styles/globals.css';
import type { Metadata } from 'next';
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import Navbar from './navbar';
import { ThemeProvider } from '@/lib/theme-context';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Sify Gist — 代码片段分享',
  description: '一个开发者向的代码片段分享平台，受 OpenGist 启发。',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
};

// Prevent theme flash: apply stored/system theme before paint.
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', dark);
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${ibmPlexSans.className} antialiased`}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 py-6">
              {children}
            </main>
            <footer className="border-t py-6" style={{ borderColor: 'var(--color-border)' }}>
              <div className="container-main text-center" style={{ color: 'var(--color-text-muted)' }}>
                <span className="text-xs font-mono">Powered by santisify · <a href="https://santisify.top">站长博客</a></span>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
