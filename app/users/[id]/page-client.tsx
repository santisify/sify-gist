'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { Gist, Visibility } from '@/lib/gists';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

interface PaginatedResult {
  data: Gist[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Props {
  userId: string;
}

export default function UserProfileClient({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [userGists, setUserGists] = useState<PaginatedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 获取用户信息
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) {
          setError('用户不存在');
          return;
        }
        const userData = await userResponse.json();
        setUser(userData);

        // 获取用户的公开 Gists
        const gistsResponse = await fetch(`/api/gists?userId=${userId}&page=${page}&limit=10`);
        if (gistsResponse.ok) {
          const gistsData = await gistsResponse.json();
          setUserGists(gistsData);
        }
      } catch (err) {
        console.error('获取用户数据失败:', err);
        setError('加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, page]);

  function getVisibilityBadge(visibility: Visibility) {
    switch (visibility) {
      case 'private':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            私有
          </span>
        );
      case 'unlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            未列出
          </span>
        );
      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <div className="container-main py-6">
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container-main py-6">
        <div className="card">
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="empty-state-title">{error || '用户不存在'}</h3>
            <p className="empty-state-desc">请检查链接是否正确</p>
            <Link href="/" className="btn btn-primary mt-4">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main py-6">
      {/* 用户信息卡片 */}
      <div className="card mb-6">
        <div className="flex flex-col items-center py-8">
          <img
            src={user.avatar_url || `https://cravatar.cn/avatar/${user.email}?d=identicon&s=96`}
            alt={user.name}
            className="w-24 h-24 rounded-full"
          />
          <h1 className="text-xl font-semibold mt-4" style={{ color: 'var(--color-text-main)' }}>
            {user.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* 用户 Gists */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold" style={{ color: 'var(--color-text-main)' }}>
            Public Gists ({userGists?.total || 0})
          </h2>
        </div>

        {userGists && userGists.data.length > 0 ? (
          <>
            {userGists.data.map((gist) => (
              <Link 
                key={gist.id} 
                href={`/gists/${gist.id}`}
                className="gist-item"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span className="gist-item-title">{gist.title || gist.files[0]?.filename || 'Untitled'}</span>
                    {getVisibilityBadge(gist.visibility)}
                    {gist.topics && gist.topics.length > 0 && (
                      <div className="flex gap-1 ml-2">
                        {gist.topics.slice(0, 3).map(topic => (
                          <span 
                            key={topic} 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {gist.description && (
                    <p className="gist-item-desc">{gist.description}</p>
                  )}
                  <div className="gist-item-meta mt-1">
                    {gist.files.length} file{gist.files.length !== 1 ? 's' : ''} · {new Date(gist.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {(gist.stars_count || 0) > 0 && (
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      {gist.stars_count}
                    </span>
                  )}
                  {(gist.forks_count || 0) > 0 && (
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {gist.forks_count}
                    </span>
                  )}
                </div>
              </Link>
            ))}

            {userGists.totalPages > 1 && (
              <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <Pagination
                  currentPage={userGists.page}
                  totalPages={userGists.totalPages}
                  total={userGists.total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="empty-state py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="empty-state-title">No public gists yet</h3>
            <p className="empty-state-desc">This user hasn't created any public gists</p>
          </div>
        )}
      </div>
    </div>
  );
}
