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

    if (password.length < 6) {
      setError('密码长度至少为 6 位');
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
        const data = await response.json();
        const { user, accessToken, refreshToken } = data;
        if (accessToken) localStorage.setItem('userToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (user) localStorage.setItem('userInfo', JSON.stringify(user));
        router.push('/');
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || '注册失败');
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
          <Link href="/" className="navbar-brand justify-center">
            <span className="brand-mark" style={{ width: 36, height: 36, fontSize: 18 }}>&gt;_</span>
            <span className="text-xl font-semibold">Sify Gist</span>
          </Link>
        </div>

        <div className="card">
          <div className="card-header">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>创建账户</h1>
          </div>

          <div className="card-body">
            {error && <div className="alert alert-danger mb-4">{error}</div>}

            {/* GitHub */}
            <a
              href="/api/auth/github"
              className="btn w-full py-2.5 mb-4"
            >
              <svg height="20" viewBox="0 0 16 16" width="20" fill="currentColor">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.07 1.87 3.75 3.65 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
              </svg>
              使用 GitHub 注册
            </a>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <span className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>或</span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">用户名</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="form-input" placeholder="您的用户名" />
              </div>
              <div className="form-group">
                <label className="form-label">邮箱地址</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">密码</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-input" placeholder="至少 6 个字符" />
              </div>
              <div className="form-group">
                <label className="form-label">确认密码</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="form-input" placeholder="再次输入密码" />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full py-2.5">
                {isSubmitting ? '创建账户中...' : '创建账户'}
              </button>
            </form>
          </div>

          <div className="card-footer text-center">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              已有账户？{' '}
              <Link href="/login" style={{ color: 'var(--color-accent)' }}>登录</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
