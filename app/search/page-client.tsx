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
    // 从 URL 参数获取初始查询
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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">搜索结果</h1>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索 Gist 标题、描述或内容..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // 更新 URL 参数
                  if (searchTerm.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
                  } else {
                    router.push('/search');
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        {filteredGists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? '没有找到匹配的 Gist' : '还没有创建任何 Gist'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGists.map((gist) => (
              <div key={gist.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    <Link href={`/gists/${gist.id}`} className="hover:underline">
                      {gist.title || '未命名 Gist'}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mt-2 line-clamp-2">
                    {gist.description || '此 Gist 没有描述'}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <span className="mr-4">📁 {gist.files.length} 文件</span>
                    <span>{new Date(gist.created_at).toLocaleDateString('zh-CN')}</span>
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