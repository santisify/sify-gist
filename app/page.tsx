// app/page.tsx
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
        // 注意：由于 getAllGists 是服务端函数，我们需要创建一个客户端 API 调用来获取数据
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Sify Gist</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-300">
          一个简单的代码片段分享平台，类似于 GitHub Gist。
          轻松创建、分享和发现代码片段。
        </p>
        <div className="mt-6">
          {isAuthenticated ? (
            <Link 
              href="/create" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              创建新的 Gist
            </Link>
          ) : (
            <button 
              onClick={handleCreateClick}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              创建新的 Gist
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 max-w-2xl mx-auto">
        <div className="text-gray-500 text-center text-sm dark:text-gray-400">
          使用上方搜索框搜索 Gist 标题、描述或内容...
        </div>
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">最新 Gists</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{gists.length} 个 Gists</span>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <p className="dark:text-gray-300">加载中...</p>
          </div>
        ) : gists.length === 0 ? (
          <div className="text-center py-12">
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
              <div key={gist.id} className="bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 truncate dark:text-white">
                      <Link href={`/gists/${gist.id}`} className="hover:underline dark:text-white">
                        {gist.title || '未命名 Gist'}
                      </Link>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}