'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();

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
        setUserAvatar(user.avatar_url || null);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="border-b" style={{ backgroundColor: 'var(--color-bg-nav)', borderColor: 'var(--color-border)' }}>
      <div className="container-main">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <rect x="2" y="2" width="28" height="28" rx="6" fill="var(--color-primary)" />
              <path d="M11 10L6 16L11 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 10L26 16L21 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 8L14 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-lg font-semibold" style={{ color: 'var(--color-text-main)' }}>Sify Gist</span>
          </a>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索代码..."
                className="w-full px-4 py-1.5 text-sm rounded-md focus:outline-none"
                style={{ 
                  backgroundColor: 'var(--color-bg-main)', 
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-main)'
                }}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* 右侧导航 */}
          <nav className="flex items-center space-x-4">
            <a 
              href="/" 
              className={`nav-link px-3 py-4 ${isActive('/') ? 'active' : ''}`}
            >
              首页
            </a>
            <a 
              href="/create" 
              className={`nav-link px-3 py-4 ${isActive('/create') ? 'active' : ''}`}
            >
              新建
            </a>
            
            {!isAuthenticated ? (
              <>
                <a href="/login" className="nav-link px-3 py-4">登录</a>
                <a 
                  href="/register" 
                  className="btn-primary px-4 py-1.5 text-sm"
                >
                  注册
                </a>
              </>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <img 
                    src={userAvatar || `https://cravatar.cn/avatar/${userEmail}?d=identicon&s=40`}
                    alt="用户头像"
                    className="w-8 h-8 user-avatar"
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                    {userName}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 border" style={{ backgroundColor: 'var(--color-bg-main)', borderColor: 'var(--color-border)' }}>
                    <a 
                      href="/profile" 
                      className="block px-4 py-2 text-sm transition-colors duration-200"
                      style={{ color: 'var(--color-text-main)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-code)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      个人中心
                    </a>
                    <a 
                      href="/profile#change-password" 
                      className="block px-4 py-2 text-sm transition-colors duration-200"
                      style={{ color: 'var(--color-text-main)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-code)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      修改密码
                    </a>
                    <div className="divider my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm transition-colors duration-200"
                      style={{ color: 'var(--color-danger)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-code)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
