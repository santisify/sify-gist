'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

interface GistFile {
  id?: number;
  gist_id?: string;
  filename: string;
  content: string;
  language: string;
}

interface GistUser {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Gist {
  id: string;
  user_id?: string;
  title?: string;
  description?: string;
  visibility: 'public' | 'unlisted' | 'private';
  created_at: string;
  updated_at: string;
  files: GistFile[];
  user?: GistUser;
}

interface PaginatedResult {
  data: Gist[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SearchPageClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<PaginatedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams?.get('q') || '';
  const page = parseInt(searchParams?.get('page') || '1', 10);

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  const searchGists = useCallback(async () => {
    if (!query.trim()) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    try {
      const userInfo = localStorage.getItem('userInfo');
      const currentUserId = userInfo ? JSON.parse(userInfo).id : null;
      
      let url = `/api/gists?q=${encodeURIComponent(query)}&page=${page}&limit=10`;
      if (currentUserId) {
        url += `&currentUserId=${currentUserId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    searchGists();
  }, [searchGists]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/search?q=${encodeURIComponent(query)}&page=${newPage}`);
  };

  function getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="container-main py-6">
      {/* 搜索头部 */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>搜索 Gist</h1>
        <form onSubmit={handleSearch} className="max-w-xl">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索标题、描述或代码内容..."
              className="w-full px-4 py-2 pr-10 text-sm"
            />
            <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* 搜索结果 */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : !query ? (
          <div className="card">
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="empty-state-title">输入关键词开始搜索</h3>
              <p className="empty-state-desc">可以搜索标题、描述、文件名或代码内容</p>
            </div>
          </div>
        ) : result?.data.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="empty-state-title">未找到匹配的 Gists</h3>
              <p className="empty-state-desc">尝试使用其他关键词搜索</p>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                找到 {result?.total} 个结果
              </span>
            </div>
            
            {result?.data.map((gist) => (
              <Link 
                key={gist.id} 
                href={`/gists/${gist.id}`}
                className="gist-item"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span className="gist-item-title">{gist.title || 'Untitled'}</span>
                  </div>
                  {gist.description && (
                    <p className="gist-item-desc truncate">
                      {gist.description}
                    </p>
                  )}
                  <div className="gist-item-meta flex items-center gap-4 mt-2">
                    {gist.user && (
                      <span className="flex items-center gap-1.5">
                        {gist.user.avatar_url ? (
                          <img src={gist.user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                        ) : (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                            {gist.user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{gist.user.name}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {gist.files.length} 文件
                    </span>
                    <span>{getTimeAgo(gist.updated_at)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {gist.files.slice(0, 3).map((file, index) => (
                    <span key={index} className="badge">
                      {file.filename}
                    </span>
                  ))}
                  {gist.files.length > 3 && (
                    <span className="badge">+{gist.files.length - 3}</span>
                  )}
                </div>
              </Link>
            ))}
            
            {result && result.totalPages > 1 && (
              <Pagination
                currentPage={result.page}
                totalPages={result.totalPages}
                total={result.total}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}