'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Pagination from '@/components/Pagination';
import GistCard from '@/components/GistCard';
import type { Gist, PaginatedResult } from '@/lib/gists';

export default function HomePageClient() {
  const [result, setResult] = useState<PaginatedResult<Gist> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchGists = useCallback(async () => {
    setIsLoading(true);
    const userInfo = localStorage.getItem('userInfo');
    const currentUserId = userInfo ? JSON.parse(userInfo).id : null;

    try {
      let url = `/api/gists?page=${page}&limit=10`;
      if (debouncedQuery) url += `&q=${encodeURIComponent(debouncedQuery)}`;
      if (currentUserId) url += `&currentUserId=${currentUserId}`;

      const response = await fetch(url);
      if (response.ok) setResult(await response.json());
    } catch (error) {
      console.error('获取 gists 时出错:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedQuery]);

  useEffect(() => {
    fetchGists();
  }, [fetchGists]);

  // Reset to page 1 on a new search
  useEffect(() => {
    if (debouncedQuery && page !== 1) router.push('/');
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery !== debouncedQuery) setDebouncedQuery(searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    params.set('page', newPage.toString());
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="container-main py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="brand-mark" style={{ width: 36, height: 36, fontSize: 18 }}>&gt;_</span>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {debouncedQuery ? `搜索: "${debouncedQuery}"` : '代码片段库'}
          </h1>
          {!isLoading && result && (
            <span className="badge font-mono">{result.total} 个结果</span>
          )}
        </div>
        <Link href="/create" className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          创建代码片段
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索代码、文件名、描述..."
            className="search-input"
            style={{ width: '100%', paddingLeft: 44, paddingRight: searchQuery ? 44 : 16 }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors hover:bg-bg-hover"
              aria-label="清除搜索"
            >
              <svg className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* States */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="loading-spinner" />
        </div>
      ) : result?.data.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h3 className="empty-state-title">
              {debouncedQuery ? '未找到匹配的代码片段' : '还没有代码片段'}
            </h3>
            <p className="empty-state-desc mb-6 max-w-md mx-auto">
              {debouncedQuery ? '尝试使用不同的关键词搜索，或者浏览发现页面查看更多代码片段' : '开始创建你的第一个代码片段，分享你的编程智慧和创意'}
            </p>
            {!debouncedQuery && (
              <Link href="/create" className="btn btn-primary">创建第一个代码片段</Link>
            )}
            {debouncedQuery && (
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
                  className="btn btn-outline"
                >
                  清除搜索
                </button>
                <Link href="/create" className="btn btn-primary">创建代码片段</Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="gist-cards-grid">
          {result?.data.map((gist) => (
            <GistCard key={gist.id} gist={gist} showCodePreview />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && result && result.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={result.page}
            totalPages={result.totalPages}
            total={result.total}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
