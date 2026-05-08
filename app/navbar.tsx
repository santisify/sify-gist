'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
        setIsAdmin(user.is_admin || false);
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
      setIsAdmin(false);
    }
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    setIsAuthenticated(false);
    setUserName('');
    router.push('/');
    router.refresh();
  };


  return (
    <header className="navbar">
      <div className="container-main">
        <div className="flex items-center justify-between h-14">
          {/* 左侧：Logo + 导航 */}
          <div className="flex items-center gap-8">
            <a href="/" className="navbar-brand group">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-8 h-8 group-hover:scale-110 transition-transform duration-300">
                <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#gradient)" />
                <path d="M11 10L6 16L11 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 10L26 16L21 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 8L14 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#4A7CF7', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#64b5f6', stopOpacity:1}} />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Sify Gist</span>
            </a>

            <nav className="navbar-nav">
              <a
                href="/"
                className={`nav-link ${pathname === '/' ? 'active' : ''} group`}
              >
                <span className="group-hover:text-blue-600 transition-colors">全部</span>
              </a>
              <a
                href="/discover"
                className={`nav-link ${pathname === '/discover' ? 'active' : ''} group`}
              >
                <span className="group-hover:text-blue-600 transition-colors">发现</span>
              </a>
              <a
                href="/create"
                className="nav-link group"
              >
                <span className="group-hover:text-blue-600 transition-colors">新建</span>
              </a>
            </nav>
          </div>

          {/* 右侧：用户菜单 */}
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <a href="/login" className="nav-link group">
                  <span className="group-hover:text-blue-600 transition-colors">登录</span>
                </a>
                <ThemeToggle />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 focus:outline-none group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <img
                      src={userAvatar || `https://cravatar.cn/avatar/${userEmail}?d=identicon&s=32`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-400 transition-all"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                      {userName}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-xl py-2 z-50 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{userName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{userEmail}</div>
                      </div>
                      <a
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        个人资料
                      </a>
                      <a
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        设置
                      </a>
                      {isAdmin && (
                        <>
                          <a
                            href="/admin/invitations"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            邀请码管理
                          </a>
                          <a
                            href="/admin/settings"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            管理员设置
                          </a>
                        </>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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