'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPageClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    setMounted(true);
    // 检查 URL 参数，显示验证成功或密码重置成功的消息
    if (searchParams.get('verified') === 'true') {
      setSuccess('邮箱验证成功！您现在可以登录了。');
    } else if (searchParams.get('reset') === 'true') {
      setSuccess('密码重置成功！请使用新密码登录。');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setNeedsEmailVerification(false);

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
        setError(data.error || 'Login failed');
        
        // 检查是否需要邮箱验证
        if (data.needsEmailVerification) {
          setNeedsEmailVerification(true);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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

        {/* Login Card */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-main)' }}>Sign in</h1>
          </div>
          
          <div className="card-body">
            {mounted && success && (
              <div className="alert alert-success mb-4">
                {success}
              </div>
            )}
            
            {error && (
              <div className="alert alert-danger mb-4">
                {error}
                {needsEmailVerification && (
                  <div className="mt-2">
                    <Link 
                      href="/auth/forgot-password"
                      className="text-sm underline hover:no-underline"
                      style={{ color: 'var(--color-text-link)' }}
                    >
                      重新发送验证邮件
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between">
                  <label className="form-label" htmlFor="password">Password</label>
                  <Link 
                    href="/auth/forgot-password"
                    className="text-xs hover:underline"
                    style={{ color: 'var(--color-text-link)' }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-2.5"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
          
          <div className="card-footer text-center">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              New to Sify Gist?{' '}
              <Link href="/register" style={{ color: 'var(--color-text-link)' }}>
                Create an account
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}