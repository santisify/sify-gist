'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPageClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    // 处理 GitHub OAuth 成功回调
    const githubSuccess = searchParams.get('github_success');
    if (githubSuccess === 'true') {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const userStr = searchParams.get('user');

      if (accessToken && refreshToken && userStr) {
        try {
          const user = JSON.parse(userStr);

          // 保存认证信息
          localStorage.setItem('userToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('userInfo', JSON.stringify(user));

          // 显示成功消息并延迟跳转
          setSuccessMessage('GitHub 登录成功！正在跳转...');

          // 清理 URL 参数并跳转到目标页面
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('github_success');
          cleanUrl.searchParams.delete('accessToken');
          cleanUrl.searchParams.delete('refreshToken');
          cleanUrl.searchParams.delete('user');

          setTimeout(() => {
            router.push(redirect || '/');
            router.refresh();
          }, 1500);
        } catch (err) {
          console.error('处理 GitHub OAuth 成功数据时出错:', err);
          setError('登录数据处理失败');
        }
      }
    }
  }, [searchParams, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { user, accessToken, refreshToken } = data;
        
        if (accessToken) {
          localStorage.setItem('userToken', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        if (user) {
          localStorage.setItem('userInfo', JSON.stringify(user));
        }
        
        router.push(redirect);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('发生错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-main py-12">
      <div className="max-w-sm mx-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-10 h-10">
              <rect x="2" y="2" width="28" height="28" rx="6" fill="var(--color-primary)" />
              <path d="M11 10L6 16L11 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 10L26 16L21 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 8L14 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>Sify Gist</span>
          </Link>
        </div>

        {/* 登录卡片 */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-main)' }}>登录</h1>
          </div>
          
          <div className="card-body">
            {error && (
              <div className="alert alert-danger mb-4">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success mb-4">
                {successMessage}
              </div>
            )}

            {/* GitHub 登录按钮 */}
            <a
              href="/api/auth/github"
              className="btn w-full py-2.5 mb-4 flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-main)',
              }}
            >
              <svg height="20" viewBox="0 0 16 16" width="20" fill="currentColor">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.07 1.87 3.75 3.65 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
              使用 GitHub 登录
            </a>

            {/* 分隔线 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }}></div>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>或</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }}></div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">邮箱地址</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="输入您的密码"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-2.5"
              >
                {isSubmitting ? '登录中...' : '登录'}
              </button>
            </form>
          </div>
          
          <div className="card-footer text-center">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              新用户？{' '}
              <Link href="/register" style={{ color: 'var(--color-text-link)' }}>
                创建账户
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}