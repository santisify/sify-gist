'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Gist, Visibility, PaginatedResult } from '@/lib/gists';
import { getTimeAgo } from '@/lib/format';
import VisibilityBadge from '@/lib/visibility-badge';
import AvatarUpload from '@/components/AvatarUpload';
import Pagination from '@/components/Pagination';

function ProfileContent() {
  const [userGists, setUserGists] = useState<PaginatedResult<Gist> | null>(null);
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

  return (
    <ProtectedRoute>
      <div className="container-main py-8">
        {/* 用户信息卡片 */}
        <div className="card mb-8 overflow-hidden">
          <div className="p-8" style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)' }}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full opacity-20 blur-xl" style={{ backgroundColor: 'white' }}></div>
                <AvatarUpload 
                  userId={userInfo?.id} 
                  currentAvatar={userInfo?.avatar_url} 
                  onAvatarUpdate={handleAvatarUpdate} 
                />
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl font-bold text-white mb-1">
                  {userInfo?.name || userInfo?.email?.split('@')[0] || '用户'}
                </h1>
                <p className="text-sm text-white opacity-90">{userInfo?.email}</p>
              </div>
              <button
                onClick={openPasswordModal}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                修改密码
              </button>
            </div>
          </div>
          
          {/* 统计信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ backgroundColor: 'var(--color-border)' }}>
            <div className="p-4 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{userGists?.total || 0}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>创建的 Gist</div>
            </div>
            <div className="p-4 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{starredGists.length}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>收藏的 Gist</div>
            </div>
            <div className="p-4 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {userGists?.data?.reduce((sum, g) => sum + g.files.length, 0) || 0}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>文件总数</div>
            </div>
            <div className="p-4 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {userGists?.data?.reduce((sum, g) => sum + (g.topics?.length || 0), 0) || 0}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>标签总数</div>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="card overflow-hidden">
          <div className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-subtle)' }}>
            <nav className="flex px-6">
              <button
                onClick={() => setActiveTab('created')}
                className="px-6 py-4 text-sm font-medium border-b-2 transition-all relative"
                style={{ 
                  borderColor: activeTab === 'created' ? 'var(--color-accent)' : 'transparent',
                  color: activeTab === 'created' ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                }}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  我创建的
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ 
                    backgroundColor: activeTab === 'created' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                    color: activeTab === 'created' ? 'white' : 'var(--color-text-muted)'
                  }}>
                    {userGists?.total || 0}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('starred')}
                className="px-6 py-4 text-sm font-medium border-b-2 transition-all"
                style={{ 
                  borderColor: activeTab === 'starred' ? 'var(--color-accent)' : 'transparent',
                  color: activeTab === 'starred' ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                }}
              >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  我收藏的
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ 
                    backgroundColor: activeTab === 'starred' ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                    color: activeTab === 'starred' ? 'white' : 'var(--color-text-muted)'
                  }}>
                    {starredGists.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6" style={{ backgroundColor: 'var(--color-bg)' }}>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--color-accent)' }}></div>
                <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>加载中...</p>
              </div>
            ) : activeTab === 'created' ? (
              userGists && userGists.data.length > 0 ? (
                <div className="card">
                  {userGists.data.map((gist) => (
                    <div
                      key={gist.id}
                      className="gist-item group"
                      style={{ cursor: 'pointer' }}
                    >
                      <Link
                        href={`/gists/${gist.id}`}
                        className="flex-1 min-w-0"
                        style={{ textDecoration: 'none' }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          <span className="gist-item-title">{gist.title || '未命名'}</span>
                          {gist.visibility !== 0 && <VisibilityBadge visibility={gist.visibility as Visibility} />}
                        </div>
                        {gist.description && (
                          <p className="gist-item-desc truncate">
                            {gist.description}
                          </p>
                        )}
                        <div className="gist-item-meta flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {gist.files.length === 1 ? '1 file' : `${gist.files.length} files`}
                          </span>
                          <span>{new Date(gist.updated_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </Link>

                      {/* 文件标签和操作按钮 */}
                      <div className="flex items-center gap-3 ml-4">
                        <div className="flex items-center gap-2">
                          {gist.files.slice(0, 3).map((file, index) => (
                            <span key={index} className="badge">
                              {file.filename}
                            </span>
                          ))}
                          {gist.files.length > 3 && (
                            <span className="badge">+{gist.files.length - 3}</span>
                          )}
                        </div>
                        
                        {/* 编辑和删除按钮 */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(`/gists/${gist.id}/edit`);
                            }}
                            className="p-1.5 rounded-md transition-colors hover:bg-opacity-80"
                            style={{ backgroundColor: 'var(--color-bg-subtle)' }}
                            title="编辑"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteGist(gist.id);
                            }}
                            className="p-1.5 rounded-md transition-colors hover:bg-red-50"
                            style={{ backgroundColor: 'var(--color-bg-subtle)' }}
                            title="删除"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
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
                <div className="card">
                  <div className="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="empty-state-title">还没有创建 Gist</h3>
                    <p className="empty-state-desc">开始创建你的第一个代码片段</p>
                    <Link href="/create" className="btn btn-primary mt-4">
                      创建 Gist
                    </Link>
                  </div>
                </div>
              )
            ) : starredGists.length > 0 ? (
              <div className="card">
                {starredGists.map((gist) => (
                  <Link 
                    key={gist.id} 
                    href={`/gists/${gist.id}`}
                    className="gist-item"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <span className="gist-item-title">{gist.title || 'Untitled'}</span>
                      </div>
                      {gist.description && (
                        <p className="gist-item-desc truncate">
                          {gist.description}
                        </p>
                      )}
                      <div className="gist-item-meta flex items-center gap-4 mt-2">
                        {gist.user && (
                          <span className="flex items-center gap-1.5">
                            {gist.user.avatar_url ? (
                              <img src={gist.user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                            ) : (
                              <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                                {gist.user.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span>{gist.user.name}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {gist.files.length === 1 ? '1 file' : `${gist.files.length} files`}
                        </span>
                        <span>{new Date(gist.updated_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                    
                    {/* 文件标签 */}
                    <div className="flex items-center gap-2 ml-4">
                      {gist.files.slice(0, 3).map((file, index) => (
                        <span 
                          key={index}
                          className="badge"
                        >
                          {file.filename}
                        </span>
                      ))}
                      {gist.files.length > 3 && (
                        <span className="badge">
                          +{gist.files.length - 3}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h3 className="empty-state-title">还没有收藏 Gist</h3>
                  <p className="empty-state-desc">浏览并收藏你喜欢的代码片段</p>
                </div>
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
              className="fixed inset-0 transition-opacity backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
              onClick={closePasswordModal}
            ></div>

            <div className="card relative w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-accent-soft)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" style={{ color: 'var(--color-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>修改密码</h3>
                </div>
                <button 
                  onClick={closePasswordModal} 
                  className="p-1.5 rounded-lg transition-colors hover:bg-opacity-80"
                  style={{ backgroundColor: 'var(--color-bg-subtle)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handlePasswordChange}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    当前密码
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-bg)',
                      borderColor: 'var(--color-border)'
                    }}
                    placeholder="输入当前密码"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    新密码
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-bg)',
                      borderColor: 'var(--color-border)'
                    }}
                    placeholder="输入新密码（至少6位）"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    确认新密码
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-lg border-2 transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-bg)',
                      borderColor: 'var(--color-border)'
                    }}
                    placeholder="再次输入新密码"
                  />
                </div>
                {passwordError && (
                  <div className="alert alert-danger mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="alert alert-success mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {passwordSuccess}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-bg-subtle)',
                      color: 'var(--color-text)'
                    }}
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
