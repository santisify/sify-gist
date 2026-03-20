// app/login/page-client.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPageClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

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
        const { user, token } = data;
        
        if (token) {
          localStorage.setItem('userToken', token);
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
      setError('登录时发生错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-main py-16">
      <div className="max-w-sm mx-auto">
        <div className="gist-card p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-12 h-12">
                <rect x="2" y="2" width="28" height="28" rx="6" fill="var(--color-primary)" />
                <path d="M11 10L6 16L11 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 10L26 16L21 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 8L14 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>登录到 Sify Gist</h1>
          </div>
          
          {error && (
            <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm"
                placeholder="your@email.com"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-2"
            >
              {isSubmitting ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <p>
              还没有账户？{' '}
              <Link href="/register" style={{ color: 'var(--color-primary)' }}>
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
