'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
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
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <a href="/" className="text-xl font-bold text-gray-900">Sify Gist</a>
        <nav className="flex items-center space-x-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索 Gist..."
                className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
          <a href="/" className="text-gray-600 hover:text-gray-900">首页</a>
          <a href="/create" className="text-gray-600 hover:text-gray-900">创建</a>
          {!isAuthenticated ? (
            <>
              <a href="/login" className="text-gray-600 hover:text-gray-900">登录</a>
              <a href="/register" className="text-gray-600 hover:text-gray-900">注册</a>
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
                    src={`https://cravatar.cn/avatar/${userEmail}?d=identicon&s=40`}
                    alt="用户头像"
                    className="w-8 h-8 rounded-full border border-gray-300"
                  />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <a 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      个人中心
                    </a>
                    <a 
                      href="/profile#change-password" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      修改密码
                    </a>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          <a href="/api-docs" className="text-gray-600 hover:text-gray-900">API 文档</a>
        </nav>
      </div>
    </header>
  );
}