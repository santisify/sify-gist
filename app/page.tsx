'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAllGists } from '@/lib/gists';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [gists, setGists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchGistsAndAuth = async () => {
      setIsLoading(true);
      
      // 检查认证状态
      const token = localStorage.getItem('userToken');
      const userInfo = localStorage.getItem('userInfo');
      setIsAuthenticated(!!(token && userInfo));
      
      try {
        const response = await fetch('/api/gists');
        if (response.ok) {
          const data = await response.json();
          setGists(data);
        } else {
          console.error('获取 gists 失败:', response.statusText);
        }
      } catch (error) {
        console.error('获取 gists 时出错:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGistsAndAuth();
  }, []);

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login?redirect=/create');
    } else {
      router.push('/create');
    }
  };

  // 计算统计数据
  const totalFiles = gists.reduce((acc, gist) => acc + gist.files.length, 0);
  const languages = new Set(gists.flatMap(gist => gist.files.map((f: any) => f.language))).size;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-16 h-16">
            <defs>
              <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3B82F6' }} />
                <stop offset="100%" style={{ stopColor: '#2563EB' }} />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#heroGrad)" />
            <path d="M11 10L6 16L11 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 10L26 16L21 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 8L14 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Sify Gist</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-300 mb-6">
          一个简洁优雅的代码片段分享平台。轻松创建、分享和管理你的代码片段，支持版本控制和语法高亮。
        </p>
        <div className="flex justify-center gap-4">
          {isAuthenticated ? (
            <Link 
              href="/create" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              创建新的 Gist
            </Link>
          ) : (
            <button 
              onClick={handleCreateClick}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              创建新的 Gist
            </button>
          )}
          <Link 
            href="/api-docs"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            API 文档
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      {!isLoading && gists.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{gists.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Gists</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalFiles}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">文件</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center dark:bg-gray-800 dark:border-gray-700">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{languages}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">语言</div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 dark:bg-blue-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">语法高亮</h3>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            支持 30+ 种编程语言的语法高亮显示，让代码更易阅读。
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 dark:bg-green-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">版本控制</h3>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            自动记录每次修改，随时查看和恢复历史版本。
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 dark:bg-purple-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">轻松分享</h3>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            一键分享或导出为 ZIP 文件，方便团队协作和代码存档。
          </p>
        </div>
      </div>

      {/* Latest Gists Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">最新 Gists</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{gists.length} 个 Gists</span>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4 dark:border-blue-400"></div>
            <p className="dark:text-gray-300">加载中...</p>
          </div>
        ) : gists.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">还没有 Gists</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">开始创建你的第一个代码片段吧！</p>
            <div className="mt-6">
              {isAuthenticated ? (
                <Link
                  href="/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  创建 Gist
                </Link>
              ) : (
                <button 
                  onClick={handleCreateClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  创建 Gist
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gists.map((gist) => (
              <Link 
                key={gist.id} 
                href={`/gists/${gist.id}`}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-lg/20 dark:hover:border-blue-500"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 truncate dark:text-white">
                      {gist.title || '未命名 Gist'}
                    </h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  
                  {gist.description && (
                    <p className="text-gray-600 mt-2 text-sm line-clamp-2 dark:text-gray-300">
                      {gist.description}
                    </p>
                  )}
                  
                  <div className="mt-4 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {gist.files.length} 文件
                    </span>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(gist.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
