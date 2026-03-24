'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Visibility, Gist } from '@/lib/gists';

interface DiscoverClientProps {
  initialTopic?: string;
}

export default function DiscoverClient({ initialTopic }: DiscoverClientProps) {
  const [gists, setGists] = useState<Gist[]>([]);
  const [topics, setTopics] = useState<{ topic: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic || null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 获取热门标签
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/topics');
        if (response.ok) {
          const data = await response.json();
          setTopics(data);
        }
      } catch (error) {
        console.error('获取标签失败:', error);
      }
    };
    
    fetchTopics();
  }, []);

  // 获取 Gists
  useEffect(() => {
    const fetchGists = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '12'
        });
        
        if (selectedTopic) {
          params.set('topic', selectedTopic);
        }
        
        const response = await fetch(`/api/gists?${params}`);
        if (response.ok) {
          const data = await response.json();
          setGists(data.data || []);
          setTotalPages(data.totalPages || 1);
        }
      } catch (error) {
        console.error('获取 Gists 失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGists();
  }, [page, selectedTopic]);

  const handleTopicClick = (topic: string) => {
    if (selectedTopic === topic) {
      setSelectedTopic(null);
    } else {
      setSelectedTopic(topic);
    }
    setPage(1);
  };

  return (
    <div className="container-main py-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-main)' }}>
          发现 Gists
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          浏览公开的代码片段，探索热门标签
        </p>
      </div>

      {/* 热门标签 */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-main)' }}>
          热门标签
        </h2>
        <div className="flex flex-wrap gap-2">
          {topics.length > 0 ? (
            topics.map(({ topic, count }) => (
              <button
                key={topic}
                onClick={() => handleTopicClick(topic)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedTopic === topic ? 'ring-2 ring-offset-1' : ''
                }`}
                style={{
                  backgroundColor: selectedTopic === topic ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                  color: selectedTopic === topic ? 'white' : 'var(--color-text-main)',
                  borderColor: selectedTopic === topic ? 'var(--color-primary)' : 'var(--color-border)'
                }}
              >
                {topic}
                <span 
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: selectedTopic === topic ? 'rgba(255,255,255,0.2)' : 'var(--color-bg-code)'
                  }}
                >
                  {count}
                </span>
              </button>
            ))
          ) : (
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>暂无标签</span>
          )}
        </div>
      </div>

      {/* 选中的标签提示 */}
      {selectedTopic && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            筛选标签:
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            {selectedTopic}
            <button onClick={() => setSelectedTopic(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
      )}

      {/* Gists 列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
        </div>
      ) : gists.length > 0 ? (
        <div className="grid gap-4">
          {gists.map(gist => (
            <GistCard key={gist.id} gist={gist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {selectedTopic ? `没有找到标签为 "${selectedTopic}" 的 Gist` : '暂无公开的 Gist'}
          </p>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-sm"
          >
            上一页
          </button>
          <span className="flex items-center px-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-sm"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

function GistCard({ gist }: { gist: Gist }) {
  return (
    <Link href={`/gists/${gist.id}`} className="block">
      <div className="card hover:shadow-lg transition-shadow">
        <div className="p-4">
          {/* 标题和作者 */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold truncate" style={{ color: 'var(--color-text-main)' }}>
              {gist.title || 'Untitled'}
            </h3>
            {gist.user && (
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {gist.user.avatar_url && (
                  <img 
                    src={gist.user.avatar_url} 
                    alt={gist.user.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {gist.user.name}
                </span>
              </div>
            )}
          </div>

          {/* 描述 */}
          {gist.description && (
            <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {gist.description}
            </p>
          )}

          {/* 文件信息 */}
          <div className="flex items-center gap-2 mb-3">
            {gist.files.slice(0, 3).map((file, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {file.filename}
              </span>
            ))}
            {gist.files.length > 3 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                +{gist.files.length - 3} more
              </span>
            )}
          </div>

          {/* 标签 */}
          {gist.topics && gist.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {gist.topics.slice(0, 4).map(topic => (
                <span
                  key={topic}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white', opacity: 0.8 }}
                >
                  {topic}
                </span>
              ))}
              {gist.topics.length > 4 && (
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  +{gist.topics.length - 4}
                </span>
              )}
            </div>
          )}

          {/* 时间 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {new Date(gist.created_at).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {gist.files.length} file{gist.files.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
