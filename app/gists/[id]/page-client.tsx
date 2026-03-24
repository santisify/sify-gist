'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import GistDisplay from '../../../components/GistDisplay';
import GistActions from '../../../components/GistActions';
import { Visibility } from '@/lib/gists';

interface File {
  id?: number;
  gist_id?: string;
  filename: string;
  content: string;
  language: string;
}

interface Gist {
  id: string;
  user_id?: string;
  title?: string;
  description?: string;
  visibility: Visibility;
  forked_from?: string;
  stars_count?: number;
  forks_count?: number;
  topics?: string[];
  created_at: string;
  updated_at: string;
  files: File[];
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

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
        const user = JSON.parse(userInfo);
        setUserId(user.id);
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
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/gists/${params.id}`, { headers });
        
        if (response.status === 403) {
          setError('没有权限访问此 Gist');
          return;
        }
        
        if (response.status === 404) {
          setError('Gist 不存在');
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          setGist(data);
          setForksCount(data.forks_count || 0);
        }
      } catch (error) {
        console.error('获取 Gist 时出错:', error);
        setError('获取 Gist 失败');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchGist();
    }
  }, [params.id, userId]);

  // 获取 Fork 列表
  useEffect(() => {
    if (activeTab === 'forks' && gist && forks.length === 0) {
      fetchForks();
    }
  }, [activeTab, gist]);

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

  function getTimeAgo(dateStr: string): string {
    // 数据库存储的是 UTC 时间，确保正确解析
    // 如果时间字符串没有 Z 后缀，添加 Z 表示 UTC
    const utcStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
    const date = new Date(utcStr);
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

  function getVisibilityBadge(visibility: Visibility) {
    switch (visibility) {
      case 'private':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            私有
          </span>
        );
      case 'unlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            未列出
          </span>
        );
      default:
        return null;
    }
  }

  async function deleteGist() {
    if (!gist || !confirm('Are you sure you want to delete this gist?')) return;
    
    const token = localStorage.getItem('userToken');
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/gists/${gist.id}`, {
        method: 'DELETE',
        headers,
      });
      
      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  if (loading) {
    return (
      <div className="container-main py-8">
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-main py-8">
        <div className="card">
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="empty-state-title">{error}</h3>
            <p className="empty-state-desc">
              {!isAuthenticated && error === '没有权限访问此 Gist' 
                ? '此 Gist 为私有，请登录后重试' 
                : '请检查链接是否正确'}
            </p>
            <button onClick={() => router.push('/')} className="btn btn-primary mt-4">
              返回首页
            </button>
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
            <svg xmlns="http://www.w3.org/2000/svg" className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="empty-state-title">Gist not found</h3>
            <p className="empty-state-desc">This gist may have been deleted or doesn't exist</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = userId && gist.user_id === userId;

  return (
    <div className="container-main py-6">
      {/* 头部 */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              {gist.user ? (
                <Link 
                  href={`/users/${gist.user.id}`}
                  className="font-medium flex items-center gap-1.5"
                  style={{ color: 'var(--color-text-link)' }}
                >
                  {gist.user.avatar_url && (
                    <img 
                      src={gist.user.avatar_url} 
                      alt={gist.user.name || 'User'} 
                      className="w-4 h-4 rounded-full"
                    />
                  )}
                  {gist.user.name}
                </Link>
              ) : (
                <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  anonymous
                </span>
              )}
              <span style={{ color: 'var(--color-text-muted)' }}>/</span>
              <Link 
                href={`/gists/${gist.id}`}
                className="font-semibold"
                style={{ color: 'var(--color-text-link)' }}
              >
                {gist.title || gist.files[0]?.filename || 'Untitled'}
              </Link>
              {getVisibilityBadge(gist.visibility)}
            </div>
            
            {/* Fork 来源 */}
            {gist.forked_from && (
              <div className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                forked from <Link href={`/gists/${gist.forked_from}`} className="font-medium" style={{ color: 'var(--color-text-link)' }}>another gist</Link>
              </div>
            )}
            
            {gist.description && (
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {gist.description}
              </p>
            )}
            
            {/* 标签 */}
            {gist.topics && gist.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {gist.topics.map(topic => (
                  <Link
                    key={topic}
                    href={`/discover?topic=${encodeURIComponent(topic)}`}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                  >
                    {topic}
                  </Link>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span>Last active {getTimeAgo(gist.updated_at)}</span>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {gist.stars_count || 0} stars
              </span>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {forksCount} forks
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <GistActions 
              gistId={gist.id} 
              gistUserId={gist.user_id}
              starsCount={gist.stars_count}
              forksCount={forksCount}
            />
            
            {isOwner && (
              <>
                <Link 
                  href={`/gists/${gist.id}/edit`}
                  className="btn btn-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
                <button 
                  onClick={deleteGist}
                  className="btn btn-danger btn-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
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
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Code
        </button>
        <button 
          onClick={() => setActiveTab('forks')}
          className={`tab ${activeTab === 'forks' ? 'active' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Forks
          {forksCount > 0 && <span className="tab-count">{forksCount}</span>}
        </button>
      </div>

      {/* 内容 */}
      {activeTab === 'code' ? (
        <GistDisplay gist={gist} />
      ) : (
        <div className="card">
          {forksLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner"></div>
            </div>
          ) : forks.length > 0 ? (
            <div>
              {forks.map(fork => (
                <Link 
                  key={fork.id}
                  href={`/gists/${fork.id}`}
                  className="gist-item"
                >
                  <div>
                    <div className="gist-item-title">{fork.title || 'Untitled'}</div>
                    <div className="gist-item-meta">
                      {fork.user?.name || 'anonymous'} · {getTimeAgo(fork.created_at)}
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
              {forksTotal > 10 && (
                <div className="p-4 text-center border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <button 
                    onClick={() => fetchForks(forksPage + 1)}
                    className="btn btn-sm"
                    disabled={forksLoading}
                  >
                    Load more
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <h3 className="empty-state-title">No forks yet</h3>
              <p className="empty-state-desc">Be the first to fork this gist!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}