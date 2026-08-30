'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Gist } from '@/lib/gists';
import GistCard from '@/components/GistCard';

type TabType = 'latest' | 'trending';

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
  const [activeTab, setActiveTab] = useState<TabType>('latest');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/topics');
        if (response.ok) setTopics(await response.json());
      } catch (error) {
        console.error('获取标签失败:', error);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    const fetchGists = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: page.toString(), limit: '12' });
        if (selectedTopic) params.set('topic', selectedTopic);

        let url = '/api/gists';
        if (activeTab === 'trending' && !selectedTopic) url = '/api/gists/trending';

        const response = await fetch(`${url}?${params}`);
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
  }, [page, selectedTopic, activeTab]);

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(selectedTopic === topic ? null : topic);
    setPage(1);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="container-main py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>发现 Gists</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          浏览公开的代码片段，探索热门标签
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {(['latest', 'trending'] as TabType[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className="btn btn-sm font-mono"
              style={
                active
                  ? { background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
                  : { background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)' }
              }
            >
              {tab === 'latest' ? '最新发布' : '热门趋势'}
            </button>
          );
        })}
      </div>

      {/* Topics */}
      <div className="mb-6">
        <h2 className="form-label">热门标签</h2>
        <div className="flex flex-wrap gap-2">
          {topics.length > 0 ? (
            topics.map(({ topic, count }) => {
              const active = selectedTopic === topic;
              return (
                <button
                  key={topic}
                  onClick={() => handleTopicClick(topic)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono transition-colors"
                  style={
                    active
                      ? { background: 'var(--color-accent)', color: '#fff', border: '1px solid var(--color-accent)' }
                      : { background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
                  }
                >
                  {topic}
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: active ? 'rgba(255,255,255,0.2)' : 'var(--color-bg-code)' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>暂无标签</span>
          )}
        </div>
      </div>

      {/* Active topic filter chip */}
      {selectedTopic && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>筛选标签:</span>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-mono"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            {selectedTopic}
            <button onClick={() => setSelectedTopic(null)} aria-label="清除筛选">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner" />
        </div>
      ) : gists.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {gists.map((gist) => (
            <GistCard key={gist.id} gist={gist} compact />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="empty-state-desc">
              {selectedTopic ? `没有找到标签为 "${selectedTopic}" 的 Gist` : '暂无公开的 Gist'}
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-sm"
          >
            上一页
          </button>
          <span className="px-3 text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
