// app/search/page-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gist } from '@/lib/gists';

interface SearchPageClientProps {
  gists: Gist[];
}

export default function SearchPageClient({ gists }: SearchPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGists, setFilteredGists] = useState<Gist[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const query = searchParams?.get('q') || '';
    setSearchTerm(query);
  }, [searchParams]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredGists(gists);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = gists.filter(gist => 
        gist.title?.toLowerCase().includes(term) || 
        gist.description?.toLowerCase().includes(term) ||
        gist.files.some(file => 
          file.content.toLowerCase().includes(term) || 
          file.filename.toLowerCase().includes(term)
        )
      );
      setFilteredGists(filtered);
    }
  }, [searchTerm, gists]);

  return (
    <div className="container-main py-6">
      {/* 搜索头部 */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-main)' }}>搜索 Gist</h1>
        <div className="max-w-xl">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索标题、描述或代码内容..."
              className="w-full px-4 py-2 pr-10 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchTerm.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
                  } else {
                    router.push('/search');
                  }
                }
              }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 搜索结果 */}
      <div className="mt-6">
        {filteredGists.length === 0 ? (
          <div className="gist-card text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {searchTerm ? '没有找到匹配的 Gist' : '还没有创建任何 Gist'}
            </p>
          </div>
        ) : (
          <div className="gist-card overflow-hidden">
            {filteredGists.map((gist) => (
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
