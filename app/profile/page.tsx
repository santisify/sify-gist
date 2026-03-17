// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Gist } from '@/lib/gists';

export default function ProfilePage() {
  const [userGists, setUserGists] = useState<Gist[]>([]);
  const [starredGists, setStarredGists] = useState<Gist[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'starred'>('created');
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  
  // 密码修改相关状态
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // 获取用户信息
        const storedUserInfo = localStorage.getItem('userInfo');
        if (!storedUserInfo) {
          router.push('/login');
          return;
        }
        
        const user = JSON.parse(storedUserInfo);
        setUserInfo(user);

        // 获取用户创建的 Gists
        const response = await fetch(`/api/gists?userId=${user.id}`);
        if (response.ok) {
          const gists = await response.json();
          setUserGists(gists);
        }

        // 获取用户收藏的 Gists
        const starredResponse = await fetch('/api/gists/starred', {
          headers: {
            'user-id': user.id
          }
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
  }, [router]);

  // 处理密码修改
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          userEmail: userInfo?.email
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('密码修改成功！');
        // 重置表单
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        
        // 在实际应用中，可能需要重新登录以确保新密码生效
        setTimeout(() => {
          localStorage.removeItem('userToken');
          localStorage.removeItem('userInfo');
          router.push('/login');
        }, 1000);
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
      const response = await fetch(`/api/gists/${gistId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 刷新用户创建的 Gists 列表
        const response = await fetch(`/api/gists?userId=${userGists[0]?.user_id || userInfo?.id}`);
        if (response.ok) {
          const gists = await response.json();
          setUserGists(gists);
        }
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除 Gist 时出错:', error);
      alert('删除失败');
    }
  };

  const currentGists = activeTab === 'created' ? userGists : starredGists;

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center">
            <img 
              src={`https://cravatar.cn/avatar/${userInfo?.email || ''}?d=identicon&s=64`}
              alt="用户头像"
              className="w-16 h-16 rounded-full border border-gray-300"
            />
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {userInfo?.name || userInfo?.email?.split('@')[0] || '用户'}
              </h1>
              <p className="text-gray-600">{userInfo?.email}</p>
            </div>
          </div>
        </div>

        {/* 密码修改部分 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8" id="change-password">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">修改密码</h2>
          <div className="max-w-md">
            <form onSubmit={handlePasswordChange}>
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  当前密码
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入当前密码"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  新密码
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入新密码（至少6位）"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  确认新密码
                </label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="再次输入新密码"
                />
              </div>
              {passwordError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4">
                  {passwordSuccess}
                </div>
              )}
              <button
                type="submit"
                disabled={isPasswordSubmitting}
                className={`py-2 px-4 rounded-md text-white font-medium ${
                  isPasswordSubmitting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isPasswordSubmitting ? '修改中...' : '修改密码'}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('created')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'created'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                我创建的 ({userGists.length})
              </button>
              <button
                onClick={() => setActiveTab('starred')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'starred'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                我收藏的 ({starredGists.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p>加载中...</p>
              </div>
            ) : currentGists.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {activeTab === 'created' ? '还没有创建 Gist' : '还没有收藏 Gist'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === 'created' 
                    ? '开始创建你的第一个代码片段吧！' 
                    : '浏览并收藏你喜欢的代码片段吧！'}
                </p>
                {activeTab === 'created' && (
                  <div className="mt-6">
                    <Link
                      href="/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      创建 Gist
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentGists.map((gist) => (
                  <div key={gist.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          <Link href={`/gists/${gist.id}`} className="hover:underline">
                            {gist.title || '未命名 Gist'}
                          </Link>
                        </h3>
                        {activeTab === 'created' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/gists/${gist.id}/edit`)}
                              className="text-gray-500 hover:text-blue-600"
                              title="编辑"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteGist(gist.id)}
                              className="text-gray-500 hover:text-red-600"
                              title="删除"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
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
      </div>
    </ProtectedRoute>
  );
}