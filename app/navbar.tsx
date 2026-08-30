'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');

    if (token && userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setIsAuthenticated(true);
        setUserName(user.name || '');
        setUserEmail(user.email || '');
        setUserAvatar(user.avatar_url || null);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('refreshToken');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
      setUserName('');
      setUserEmail('');
      setUserAvatar(null);
    }
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setShowUserMenu(false);
    router.push('/');
    router.refresh();
  };

  const avatarSrc = userAvatar || `https://cravatar.cn/avatar/${userEmail}?d=identicon&s=64`;

  return (
    <header className="navbar">
      <div className="container-main">
        <div className="flex items-center justify-between h-14">
          {/* Left: brand + nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="navbar-brand">
              <span className="brand-mark">&gt;_</span>
              <span>Sify Gist</span>
            </Link>

            <nav className="navbar-nav">
              <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
                全部
              </Link>
              <Link href="/discover" className={`nav-link ${pathname === '/discover' ? 'active' : ''}`}>
                发现
              </Link>
              <Link href="/create" className="nav-link">
                新建
              </Link>
            </nav>
          </div>

          {/* Right: auth / theme */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/login" className="nav-link">
                  登录
                </Link>
                <ThemeToggle />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 p-1 rounded-md transition-colors hover:bg-bg-hover"
                    style={{ '--tw-ring-color': 'var(--ring)' } as React.CSSProperties}
                    aria-label="用户菜单"
                    aria-expanded={showUserMenu}
                  >
                    <img
                      src={avatarSrc}
                      alt={userName}
                      className="w-7 h-7 rounded-full"
                      style={{ border: '1px solid var(--color-border)' }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {userName}
                    </span>
                    <svg className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-52 rounded-lg shadow-lg py-2 z-50"
                      style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{userName}</div>
                        <div className="text-xs truncate font-mono" style={{ color: 'var(--color-text-muted)' }}>{userEmail}</div>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-bg-hover"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        个人资料
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-bg-hover"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        设置
                      </Link>
                      <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors hover:bg-bg-hover"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a2 2 0 01-2-2V7a2 2 0 012-2h5a3 3 0 013 3v1" />
                          </svg>
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
