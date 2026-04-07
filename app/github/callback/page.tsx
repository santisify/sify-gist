'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGitHubCallback = async () => {
      try {
        // 获取 URL 参数
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        console.log('GitHub OAuth Callback - 参数检查:', {
          hasCode: !!code,
          hasState: !!state,
          code: code ? code.substring(0, 10) + '...' : null,
          state: state ? state.substring(0, 10) + '...' : null
        });

        if (!code || !state) {
          throw new Error('缺少必要的 OAuth 参数');
        }

        // 发送请求到后端
        console.log('发送 OAuth 回调请求到后端...');
        const response = await fetch(`/api/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`, {
          method: 'GET',
        });

        const data = await response.json();
        console.log('OAuth 回调响应:', {
          ok: response.ok,
          hasAccessToken: !!data.accessToken,
          error: data.error
        });

        if (response.ok && data.accessToken) {
          // 保存认证信息到 localStorage（与登录保持一致）
          localStorage.setItem('userToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('userInfo', JSON.stringify(data.user));

          console.log('认证信息已保存，重定向到首页...');
          // 重定向到首页
          router.push('/');
          router.refresh();
        } else {
          const errorMessage = data.error || 'oauth_error';
          console.error('GitHub OAuth 失败:', errorMessage);
          setError(errorMessage);
          setTimeout(() => {
            router.push(`/login?error=${errorMessage}`);
          }, 2000);
        }
      } catch (error) {
        console.error('处理 GitHub OAuth 回调时出错:', error);
        const errorMessage = error instanceof Error ? error.message : 'oauth_callback_error';
        setError(errorMessage);
        setTimeout(() => {
          router.push(`/login?error=${errorMessage}`);
        }, 2000);
      }
    };

    handleGitHubCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="card-body text-center">
            <div className="mb-4" style={{ color: 'var(--color-danger)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-main)' }}>
              登录失败
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {error}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              即将返回登录页面...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="loading-spinner mb-4"></div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          正在处理 GitHub 登录...
        </p>
      </div>
    </div>
  );
}

export default function GitHubOAuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            正在处理 GitHub 登录...
          </p>
        </div>
      </div>
    }>
      <GitHubCallbackContent />
    </Suspense>
  );
}