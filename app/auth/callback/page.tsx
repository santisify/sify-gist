'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // 从 URL 中获取 token
        const urlParams = new URLSearchParams(window.location.search);
        const token_hash = urlParams.get('token_hash');
        const type = urlParams.get('type');
        
        if (!token_hash || !type) {
          setStatus('error');
          setMessage('无效的验证链接');
          return;
        }

        let result;
        
        if (type === 'signup') {
          // 处理邮箱验证
          result = await supabase.auth.verifyOtp({
            token_hash,
            type: 'signup',
          });
          
          if (result.error) {
            throw result.error;
          }
          
          // 更新 users 表中的 email_verified 字段
          if (result.data.user) {
            await fetch('/api/auth/verify-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: result.data.user.id,
              }),
            });
          }
          
          setStatus('success');
          setMessage('邮箱验证成功！正在跳转到登录页面...');
          
          // 3秒后跳转到登录页面
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else if (type === 'recovery') {
          // 处理密码重置
          result = await supabase.auth.verifyOtp({
            token_hash,
            type: 'recovery',
          });
          
          if (result.error) {
            throw result.error;
          }
          
          setStatus('success');
          setMessage('身份验证成功！正在跳转到密码重置页面...');
          
          // 保存 session 并跳转到密码重置页面
          if (result.data.session) {
            localStorage.setItem('resetPasswordToken', result.data.session.access_token);
          }
          
          setTimeout(() => {
            router.push('/auth/reset-password');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('未知的验证类型');
        }
      } catch (error: any) {
        console.error('验证错误:', error);
        setStatus('error');
        setMessage(error.message || '验证失败，请重试');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                正在验证...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                请稍候
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                验证成功
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                验证失败
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {message}
              </p>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                返回登录
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
