'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPageClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/login';

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
        
        // 检查是否需要邮箱验证
        if (data.needsEmailVerification) {
          setSuccess(true);
          setSuccessMessage(data.message);
        } else {
          // 如果不需要验证，直接登录
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
          
          router.push('/');
          router.refresh();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Registration failed');
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

        {/* Register Card */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-main)' }}>
              {success ? 'Check your email' : 'Create an account'}
            </h1>
          </div>
          
          <div className="card-body">
            {error && (
              <div className="alert alert-danger mb-4">
                {error}
              </div>
            )}

            {mounted && success ? (
              <div className="text-center py-6">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-base mb-2" style={{ color: 'var(--color-text-main)' }}>
                  {successMessage}
                </p>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  We sent a verification link to <strong>{email}</strong>
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="btn btn-primary w-full py-2.5"
                >
                  Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Your name"
                  />
                </div>

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
                  <label className="form-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="form-input"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full py-2.5"
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            )}
          </div>
          
          {!success && (
            <div className="card-footer text-center">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--color-text-link)' }}>
                  Sign in
                </Link>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}