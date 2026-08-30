'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { Gist, Visibility, PaginatedResult } from '@/lib/gists';
import { getTimeAgo } from '@/lib/format';
import VisibilityBadge from '@/lib/visibility-badge';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
}

interface Props {
  userId: string;
}

export default function UserProfileClient({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [userGists, setUserGists] = useState<PaginatedResult<Gist> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) { setError('用户不存在'); return; }
        setUser(await userResponse.json());

        const gistsResponse = await fetch(`/api/gists?userId=${userId}&page=${page}&limit=10`);
        if (gistsResponse.ok) setUserGists(await gistsResponse.json());
      } catch (err) {
        console.error('获取用户数据失败:', err);
        setError('加载失败');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [userId, page]);

  if (isLoading) {
    return (
      <div className="container-main py-6">
        <div className="flex justify-center py-12"><div className="loading-spinner" /></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container-main py-6">
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="empty-state-title">{error || '用户不存在'}</h3>
            <p className="empty-state-desc">请检查链接是否正确</p>
            <Link href="/" className="btn btn-primary mt-4">返回首页</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main py-6">
      {/* User card */}
      <div className="card mb-6">
        <div className="flex flex-col items-center py-8">
          <img
            src={user.avatar_url || `https://cravatar.cn/avatar/${user.email}?d=identicon&s=96`}
            alt={user.name}
            className="w-24 h-24 rounded-full"
            style={{ border: '2px solid var(--color-border)' }}
          />
          <h1 className="text-xl font-semibold mt-4" style={{ color: 'var(--color-text)' }}>{user.name}</h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'var(--color-text-muted)' }}>
            Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* User gists */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
            公开 Gists ({userGists?.total || 0})
          </h2>
        </div>

        {userGists && userGists.data.length > 0 ? (
          <>
            {userGists.data.map((gist) => (
              <Link key={gist.id} href={`/gists/${gist.id}`} className="gist-item">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <svg className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span className="gist-item-title">{gist.title || gist.files[0]?.filename || 'Untitled'}</span>
                    <VisibilityBadge visibility={gist.visibility as Visibility} />
                    {gist.topics && gist.topics.length > 0 && (
                      <div className="flex gap-1 ml-2 flex-wrap">
                        {gist.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono"
                            style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {gist.description && <p className="gist-item-desc">{gist.description}</p>}
                  <div className="gist-item-meta mt-1 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {gist.files.length} file{gist.files.length !== 1 ? 's' : ''}
                    </span>
                    <span>·</span>
                    <span>{getTimeAgo(gist.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {(gist.nb_likes || 0) > 0 && (
                    <span className="text-xs flex items-center gap-1 font-mono" style={{ color: 'var(--color-text-muted)' }}>★ {gist.nb_likes}</span>
                  )}
                  {(gist.nb_forks || 0) > 0 && (
                    <span className="text-xs flex items-center gap-1 font-mono" style={{ color: 'var(--color-text-muted)' }}>⑂ {gist.nb_forks}</span>
                  )}
                </div>
              </Link>
            ))}

            {userGists.totalPages > 1 && (
              <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
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
            <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="empty-state-title">还没有公开的 Gist</h3>
            <p className="empty-state-desc">该用户尚未创建任何公开的代码片段</p>
          </div>
        )}
      </div>
    </div>
  );
}
