'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import GistDisplay from '../../../components/GistDisplay';
import GistActions from '../../../components/GistActions';
import type { Gist, Visibility } from '@/lib/gists';
import { getTimeAgo } from '@/lib/format';
import VisibilityBadge from '@/lib/visibility-badge';

export default function GistPageClient() {
  const params = useParams();
  const router = useRouter();
  const [gist, setGist] = useState<Gist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'forks'>('code');
  const [forksCount, setForksCount] = useState(0);
  const [forks, setForks] = useState<Gist[]>([]);
  const [forksLoading, setForksLoading] = useState(false);
  const [forksPage, setForksPage] = useState(1);
  const [forksTotal, setForksTotal] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');
    if (token && userInfo) {
      setIsAuthenticated(true);
      try {
        setUserId(JSON.parse(userInfo).id);
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    } else {
      setIsAuthenticated(false);
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    const fetchGist = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('userToken');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/gists/${params.id}`, { headers });
        if (response.status === 403) { setError('没有权限访问此 Gist'); return; }
        if (response.status === 404) { setError('Gist 不存在'); return; }
        if (response.ok) {
          const data = await response.json();
          setGist(data);
          setForksCount(data.forks_count || data.nb_forks || 0);
        }
      } catch (error) {
        console.error('获取 Gist 时出错:', error);
        setError('获取 Gist 失败');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchGist();
  }, [params.id, userId]);

  useEffect(() => {
    if (activeTab === 'forks' && gist && forks.length === 0) fetchForks();
  }, [activeTab, gist]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchForks = async (page = 1) => {
    if (!gist) return;
    setForksLoading(true);
    try {
      const response = await fetch(`/api/gists/${gist.id}/forks?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setForks(data.data || []);
        setForksTotal(data.total || 0);
        setForksPage(page);
      }
    } catch (error) {
      console.error('获取 Fork 列表失败:', error);
    } finally {
      setForksLoading(false);
    }
  };

  async function deleteGist() {
    if (!gist || !confirm('确定要删除这个 Gist 吗？此操作不可撤销。')) return;
    const token = localStorage.getItem('userToken');
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`/api/gists/${gist.id}`, { method: 'DELETE', headers });
      if (response.ok) router.push('/');
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  if (loading) {
    return (
      <div className="container-main py-8">
        <div className="flex justify-center py-12"><div className="loading-spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-main py-8">
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="empty-state-title">{error}</h3>
            <p className="empty-state-desc">
              {!isAuthenticated && error === '没有权限访问此 Gist' ? '此 Gist 为私有，请登录后重试' : '请检查链接是否正确'}
            </p>
            <button onClick={() => router.push('/')} className="btn btn-primary mt-4">返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="container-main py-8">
        <div className="card">
          <div className="empty-state">
            <h3 className="empty-state-title">Gist 不存在</h3>
            <p className="empty-state-desc">该 Gist 可能已被删除或从未存在</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = userId && gist.user_id === userId;

  return (
    <div className="container-main py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="brand-mark">&gt;_</span>
                <div>
                  {gist.user ? (
                    <Link
                      href={`/users/${gist.user.id}`}
                      className="font-medium flex items-center gap-2 transition-colors hover:opacity-80"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {gist.user.avatar_url && (
                        <img
                          src={gist.user.avatar_url}
                          alt={gist.user.name || 'User'}
                          className="w-5 h-5 rounded-full"
                          style={{ border: '1px solid var(--color-border)' }}
                        />
                      )}
                      <span className="font-semibold">{gist.user.name}</span>
                    </Link>
                  ) : (
                    <span className="font-medium" style={{ color: 'var(--color-text-muted)' }}>anonymous</span>
                  )}
                  <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {gist.id.slice(0, 8)}
                  </div>
                </div>
              </div>
              <span style={{ color: 'var(--color-text-muted)' }}>/</span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/gists/${gist.id}`}
                  className="text-xl font-bold transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-text)' }}
                >
                  {gist.title || gist.files[0]?.filename || 'Untitled'}
                </Link>
                <VisibilityBadge visibility={gist.visibility as Visibility} />
              </div>
            </div>

            {/* Fork source */}
            {gist.forked_id && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono mb-4"
                style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Forked from</span>
                <Link href={`/gists/${gist.forked_id}`} className="font-medium hover:underline">another gist</Link>
              </div>
            )}

            {gist.description && (
              <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}>
                <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{gist.description}</p>
              </div>
            )}

            {/* Topics */}
            {gist.topics && gist.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {gist.topics.map((topic) => (
                  <Link
                    key={topic}
                    href={`/discover?topic=${encodeURIComponent(topic)}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-mono transition-colors"
                    style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                  >
                    #{topic}
                  </Link>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-5 text-sm font-mono flex-wrap" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Updated {getTimeAgo(gist.updated_at)}
              </span>
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{gist.nb_likes || 0}</span>
                stars
              </span>
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{forksCount}</span>
                forks
              </span>
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{gist.files.length}</span>
                {gist.files.length === 1 ? 'file' : 'files'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <GistActions
              gistId={gist.id}
              gistUserId={gist.user_id}
              nbLikes={gist.nb_likes}
              nbForks={gist.nb_forks}
            />
            {isOwner && (
              <>
                <Link href={`/gists/${gist.id}/edit`} className="btn btn-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  编辑
                </Link>
                <button onClick={deleteGist} className="btn btn-danger btn-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  删除
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab('code')}
          className={`tab ${activeTab === 'code' ? 'active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span>Code</span>
          <span className="tab-count">{gist.files.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('forks')}
          className={`tab ${activeTab === 'forks' ? 'active' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Forks</span>
          {forksCount > 0 && <span className="tab-count">{forksCount}</span>}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'code' ? (
        <GistDisplay gist={gist} />
      ) : (
        <div className="card">
          {forksLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="loading-spinner" />
              <p className="mt-4 font-mono text-sm" style={{ color: 'var(--color-text-muted)' }}>加载 Forks...</p>
            </div>
          ) : forks.length > 0 ? (
            <div>
              <div className="card-header">
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  {forksCount} {forksCount === 1 ? 'Fork' : 'Forks'}
                </h3>
              </div>
              <div>
                {forks.map((fork) => (
                  <Link
                    key={fork.id}
                    href={`/gists/${fork.id}`}
                    className="block p-4 transition-colors hover:bg-bg-hover"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          {fork.user?.avatar_url ? (
                            <img
                              src={fork.user.avatar_url}
                              alt={fork.user.name || 'User'}
                              className="w-8 h-8 rounded-full"
                              style={{ border: '1px solid var(--color-border)' }}
                            />
                          ) : (
                            <span
                              className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-semibold text-sm"
                              style={{ background: 'var(--color-bg-code)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}
                            >
                              {(fork.user?.name || 'A').charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div>
                            <h4 className="font-medium" style={{ color: 'var(--color-text)' }}>{fork.title || 'Untitled'}</h4>
                            <p className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
                              by <span className="font-medium">{fork.user?.name || 'anonymous'}</span> · {getTimeAgo(fork.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <svg className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
              {forksTotal > 10 && (
                <div className="card-footer">
                  <button onClick={() => fetchForks(forksPage + 1)} disabled={forksLoading} className="btn btn-outline w-full">
                    加载更多
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <h3 className="empty-state-title">还没有 Fork</h3>
              <p className="empty-state-desc">成为第一个 Fork 这个 Gist 的人</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
