// components/ProtectedRoute.tsx
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectPath?: string;
  loginMessage?: string;
}

export default function ProtectedRoute({ 
  children, 
  redirectPath = '/login', 
  loginMessage = '请先登录以访问此页面' 
}: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null 表示正在检查
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 检查本地存储中的用户认证状态
        const userToken = localStorage.getItem('userToken');
        const userInfo = localStorage.getItem('userInfo');
        
        if (!userToken || !userInfo) {
          // 未登录，重定向到登录页面
          router.push(redirectPath);
          return;
        }
        
        // 验证 token 是否有效
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userToken}`,
          }
        });
        
        if (!response.ok) {
          // Token 无效，清除本地存储并重定向到登录页面
          localStorage.removeItem('userToken');
          localStorage.removeItem('userInfo');
          router.push(redirectPath);
          return;
        }
        
        setIsAuthenticated(true);
      } catch (err) {
        console.error('认证检查失败:', err);
        // 发生错误时也重定向到登录页面
        router.push(redirectPath);
      }
    };

    checkAuth();
  }, [redirectPath, router]);

  // 如果还在检查认证状态，显示加载状态
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>检查登录状态...</p>
      </div>
    );
  }

  // 如果未认证，不显示内容，因为已经重定向
  if (isAuthenticated === false) {
    return null;
  }

  // 如果已认证，渲染子组件
  return <>{children}</>;
}