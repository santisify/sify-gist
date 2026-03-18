'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // 检查认证状态和用户信息
    const token = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setIsAuthenticated(true);
        setUserName(user.name || '');
        setUserEmail(user.email || '');
        setUserAvatar(user.avatar_url || null); // 设置用户头像
      } catch (e) {
        console.error('解析用户信息失败:', e);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
      }
    }

    // 点击外部区域关闭菜单
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // 移除事件监听器
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/20">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <a href="/" className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-8 h-8">
            <defs>
              <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3B82F6' }} />
                <stop offset="100%" style={{ stopColor: '#2563EB' }} />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#navGrad)" />
            <path d="M11 10L6 16L11 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 10L26 16L21 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 8L14 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span>Sify Gist</span>
        </a>
        <nav className="flex items-center space-x-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索 Gist..."
                className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
          <a href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">首页</a>
          <a href="/create" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">创建</a>
          {!isAuthenticated ? (
            <>
              <a href="/login" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">登录</a>
              <a href="/register" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">注册</a>
            </>
          ) : (
            <>
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 focus:outline-none"
                  aria-haspopup="true"
                  aria-expanded={showUserMenu}
                >
                                  <img 
                                    src={userAvatar || `https://cravatar.cn/avatar/${userEmail}?d=identicon&s=40`}
                                    alt="用户头像"
                                    className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600"
                                  />                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <a 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      个人中心
                    </a>
                    <a 
                      href="/profile#change-password" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      修改密码
                    </a>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          <ThemeToggle />
          <a href="/api-docs" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">API 文档</a>
        </nav>
      </div>
    </header>
  );
}