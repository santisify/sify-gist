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

  return (
    <header className="navbar">
      <div className="container-main">
        <div className="flex items-center justify-between h-14">
          {/* 左侧：Logo + 导航 */}
          <div className="flex items-center gap-6">
            <a href="/" className="navbar-brand">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-7 h-7">
                <rect x="2" y="2" width="28" height="28" rx="6" fill="var(--color-primary)" />
                <path d="M11 10L6 16L11 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 10L26 16L21 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 8L14 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span>Sify Gist</span>
            </a>
            
            <nav className="navbar-nav">
              <a 
                href="/" 
                className={`nav-link ${pathname === '/' ? 'active' : ''}`}
              >
                All
              </a>
              <a 
                href="/discover" 
                className={`nav-link ${pathname === '/discover' ? 'active' : ''}`}
              >
                Discover
              </a>
              <a 
                href="/create" 
                className="nav-link"
              >
                New
              </a>
            </nav>
          </div>

          {/* 右侧：搜索 + 用户 */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Code search"
                  className="search-input"
                  style={{ paddingLeft: '32px' }}
                />
              </div>
            </form>
            
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <a href="/login" className="nav-link">Sign in</a>
                <ThemeToggle />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <img 
                      src={userAvatar || `https://cravatar.cn/avatar/${userEmail}?d=identicon&s=32`}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full"
                    />
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {userName}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg py-1 z-50 border" style={{ backgroundColor: 'var(--color-bg-main)', borderColor: 'var(--color-border)' }}>
                      <a 
                        href="/profile" 
                        className="block px-3 py-2 text-sm"
                        style={{ color: 'var(--color-text-main)' }}
                      >
                        Profile
                      </a>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        Sign out
                      </button>
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