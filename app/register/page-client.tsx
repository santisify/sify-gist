// app/register/page-client.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPageClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        router.push(redirect);
      } else {
        const data = await response.json();
        setError(data.error || '注册失败');
      }
    } catch (err) {
      setError('注册时发生错误，请稍后重试');
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
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>注册新账户</h1>
          </div>
          
          {error && (
            <div className="mb-4 p-3 rounded-md text-sm" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                姓名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm"
                placeholder="输入您的姓名"
              />
            </div>

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

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm"
                placeholder="至少8位密码"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm"
                placeholder="再次输入密码"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-2"
            >
              {isSubmitting ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <p>
              已有账户？{' '}
              <Link href="/login" style={{ color: 'var(--color-primary)' }}>
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
