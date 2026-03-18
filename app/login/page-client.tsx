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
        
        // 存储认证信息
        if (token) {
          localStorage.setItem('userToken', token);
        }
        if (user) {
          localStorage.setItem('userInfo', JSON.stringify(user));
        }
        
        // 重定向到原始请求的页面或首页
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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:shadow-gray-900/20">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6 dark:text-white">登录到 Sify Gist</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            邮箱
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="your@email.com"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            密码
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isSubmitting 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800`}
        >
          {isSubmitting ? '登录中...' : '登录'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          还没有账户？{' '}
          <Link href="/register" className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}