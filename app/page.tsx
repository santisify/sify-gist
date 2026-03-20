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
      
      const token = localStorage.getItem('userToken');
      const userInfo = localStorage.getItem('userInfo');
      setIsAuthenticated(!!(token && userInfo));
      
      try {
        const response = await fetch('/api/gists');
        if (response.ok) {
          const data = await response.json();
          setGists(data);
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

  const totalFiles = gists.reduce((acc, gist) => acc + gist.files.length, 0);
  const languages = new Set(gists.flatMap(gist => gist.files.map((f: any) => f.language))).size;

  return (
    <div className="container-main">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-16 h-16">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="var(--color-primary)" />
            <path d="M11 10L6 16L11 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 10L26 16L21 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 8L14 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text-main)' }}>Sify Gist</h1>
        <p className="text-base max-w-xl mx-auto mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          一个简洁优雅的代码片段分享平台，支持版本控制和语法高亮
        </p>
        <div className="flex justify-center gap-3">
          {isAuthenticated ? (
            <Link href="/create" className="btn-primary px-6 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新建 Gist
            </Link>
          ) : (
            <button onClick={handleCreateClick} className="btn-primary px-6 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新建 Gist
            </button>
          )}
          <Link href="/api-docs" className="btn-outline px-6 py-2">
            API 文档
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      {!isLoading && gists.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
          <div className="gist-card text-center p-4">
            <div className="stat-number">{gists.length}</div>
            <div className="stat-label">Gists</div>
          </div>
          <div className="gist-card text-center p-4">
            <div className="stat-number">{totalFiles}</div>
            <div className="stat-label">文件</div>
          </div>
          <div className="gist-card text-center p-4">
            <div className="stat-number">{languages}</div>
            <div className="stat-label">语言</div>
          </div>
        </div>
      )}

      {/* Latest Gists */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>所有 Gists</h2>
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{gists.length} 个</span>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
            <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>加载中...</p>
          </div>
        ) : gists.length === 0 ? (
          <div className="gist-card text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>还没有 Gists</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>开始创建你的第一个代码片段</p>
            {isAuthenticated ? (
              <Link href="/create" className="btn-primary px-4 py-1.5 text-sm">
                创建 Gist
              </Link>
            ) : (
              <button onClick={handleCreateClick} className="btn-primary px-4 py-1.5 text-sm">
                创建 Gist
              </button>
            )}
          </div>
        ) : (
          <div className="gist-card overflow-hidden">
            {gists.map((gist, index) => (
              <Link 
                key={gist.id} 
                href={`/gists/${gist.id}`}
                className="list-item"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <h3 className="font-medium truncate" style={{ color: 'var(--color-text-main)' }}>
                      {gist.title || '未命名 Gist'}
                    </h3>
                  </div>
                  {gist.description && (
                    <p className="text-sm mt-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {gist.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {gist.files.length} 文件
                  </span>
                  <span>{new Date(gist.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}