'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Gist, Visibility } from '@/lib/gists';
import AvatarUpload from '@/components/AvatarUpload';
import Pagination from '@/components/Pagination';

interface PaginatedResult {
  data: Gist[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function ProfileContent() {
  const [userGists, setUserGists] = useState<PaginatedResult | null>(null);
  const [starredGists, setStarredGists] = useState<Gist[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'starred'>('created');
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams?.get('page') || '1', 10);

  const fetchUserGists = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/gists?userId=${userId}&currentUserId=${userId}&page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setUserGists(data);
      }
    } catch (error) {
      console.error('获取用户 Gists 失败:', error);
    }
  }, [page]);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (!storedUserInfo) {
          router.push('/login');
          return;
        }
        
        const user = JSON.parse(storedUserInfo);
        setUserInfo(user);

        await fetchUserGists(user.id);

        const starredResponse = await fetch('/api/gists/starred', {
          headers: { 'user-id': user.id }
        });
        if (starredResponse.ok) {
          const starred = await starredResponse.json();
          setStarredGists(starred);
        }
      } catch (error) {
        console.error('获取用户数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router, fetchUserGists]);

  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsPasswordSubmitting(true);

    if (newPassword !== confirmNewPassword) {
      setPasswordError('新密码与确认密码不一致');
      setIsPasswordSubmitting(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('新密码长度不能少于6位');
      setIsPasswordSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          userEmail: userInfo?.email
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('密码修改成功！');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        
        setTimeout(() => {
          closePasswordModal();
          localStorage.removeItem('userToken');
          localStorage.removeItem('userInfo');
          router.push('/login');
        }, 1500);
      } else {
        setPasswordError(data.error || '密码修改失败');
      }
    } catch (error) {
      console.error('修改密码时出错:', error);
      setPasswordError('修改密码时发生错误，请稍后重试');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleDeleteGist = async (gistId: string) => {
    if (!confirm('确定要删除这个 Gist 吗？此操作不可撤销。')) {
      return;
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (userInfo?.id) {
        headers['X-User-Id'] = userInfo.id;
      }
      
      const response = await fetch(`/api/gists/${gistId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        if (userInfo?.id) {
          await fetchUserGists(userInfo.id);
        }
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除 Gist 时出错:', error);
      alert('删除失败');
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    const updatedUserInfo = {
      ...userInfo,
      avatar_url: newAvatarUrl
    };
    setUserInfo(updatedUserInfo);
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/profile?page=${newPage}`);
  };

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

  return (
    <ProtectedRoute>
      <div className="container-main py-6">
        {/* 用户信息卡片 */}
        <div className="gist-card mb-6">
          <div className="flex flex-col items-center py-6">
            <AvatarUpload 
              userId={userInfo?.id} 
              currentAvatar={userInfo?.avatar_url} 
              onAvatarUpdate={handleAvatarUpdate} 
            />
            <div className="mt-4 text-center">
              <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
                {userInfo?.name || userInfo?.email?.split('@')[0] || '用户'}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{userInfo?.email}</p>
            </div>
            <button
              onClick={openPasswordModal}
              className="btn-outline mt-4 px-4 py-1.5 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              修改密码
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="gist-card overflow-hidden">
          <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
            <nav className="flex">
              <button
                onClick={() => setActiveTab('created')}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{ 
                  borderColor: activeTab === 'created' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'created' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                }}
              >
                我创建的 ({userGists?.total || 0})
              </button>
              <button
                onClick={() => setActiveTab('starred')}
                className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{ 
                  borderColor: activeTab === 'starred' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'starred' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                }}
              >
                我收藏的 ({starredGists.length})
              </button>
            </nav>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>加载中...</p>
              </div>
            ) : activeTab === 'created' ? (
              userGists && userGists.data.length > 0 ? (
                <div>
                  <div className="gist-card border-0">
                    {userGists.data.map((gist) => (
                      <div key={gist.id} className="list-item">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            <Link 
                              href={`/gists/${gist.id}`}
                              className="font-medium truncate"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              {gist.title || '未命名 Gist'}
                            </Link>
                            {getVisibilityBadge(gist.visibility)}
                          </div>
                          {gist.description && (
                            <p className="text-sm mt-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                              {gist.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            {gist.files.length} 文件
                          </span>
                          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            {new Date(gist.created_at).toLocaleDateString('zh-CN')}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/gists/${gist.id}/edit`)}
                              className="btn-sm"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteGist(gist.id)}
                              className="btn-danger px-2 py-1 text-xs"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {userGists.totalPages > 1 && (
                    <Pagination
                      currentPage={userGists.page}
                      totalPages={userGists.totalPages}
                      total={userGists.total}
                      onPageChange={handlePageChange}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                    还没有创建 Gist
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    开始创建你的第一个代码片段
                  </p>
                  <Link href="/create" className="btn-primary px-4 py-1.5 text-sm mt-4 inline-flex">
                    创建 Gist
                  </Link>
                </div>
              )
            ) : starredGists.length > 0 ? (
              <div className="gist-card border-0">
                {starredGists.map((gist) => (
                  <div key={gist.id} className="list-item">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <Link 
                          href={`/gists/${gist.id}`}
                          className="font-medium truncate"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {gist.title || '未命名 Gist'}
                        </Link>
                      </div>
                      {gist.description && (
                        <p className="text-sm mt-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                          {gist.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {gist.files.length} 文件
                      </span>
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {new Date(gist.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                  还没有收藏 Gist
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  浏览并收藏你喜欢的代码片段
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 密码修改弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div 
              className="fixed inset-0 transition-opacity"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              onClick={closePasswordModal}
            ></div>

            <div className="gist-card relative w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-main)' }}>修改密码</h3>
                <button onClick={closePasswordModal} style={{ color: 'var(--color-text-muted)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handlePasswordChange}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                    当前密码
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm"
                    placeholder="输入当前密码"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                    新密码
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 text-sm"
                    placeholder="输入新密码（至少6位）"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                    确认新密码
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm"
                    placeholder="再次输入新密码"
                  />
                </div>
                {passwordError && (
                  <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
                    {passwordSuccess}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="btn-outline px-4 py-2"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isPasswordSubmitting}
                    className="btn-primary px-4 py-2"
                  >
                    {isPasswordSubmitting ? '修改中...' : '确认修改'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="container-main py-6">
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
