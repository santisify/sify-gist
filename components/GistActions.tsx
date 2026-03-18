// components/GistActions.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GistActionsProps {
  gistId: string;
  isAuthenticated: boolean;
  userId: string | null;
}

export default function GistActions({ gistId, isAuthenticated, userId }: GistActionsProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setLoading(false);
      return;
    }

    const fetchStarStatus = async () => {
      try {
        const response = await fetch(`/api/gists/${gistId}/star`, {
          headers: {
            'user-id': userId
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsStarred(data.isStarred);
        }
      } catch (error) {
        console.error('获取收藏状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    // 简单模拟获取收藏总数（实际应用中可以创建一个获取总数的API）
    setStarCount(0); // 这里可以调用获取总数的API
    fetchStarStatus();
  }, [gistId, isAuthenticated, userId]);

  const handleStarToggle = async () => {
    if (!isAuthenticated) {
      // 如果未登录，重定向到登录页面
      window.location.href = `/login?redirect=/gists/${gistId}`;
      return;
    }

    if (!userId) return;

    try {
      if (isStarred) {
        // 取消收藏
        const response = await fetch(`/api/gists/${gistId}/star`, {
          method: 'DELETE',
          headers: {
            'user-id': userId,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsStarred(false);
          setStarCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // 添加收藏
        const response = await fetch(`/api/gists/${gistId}/star`, {
          method: 'POST',
          headers: {
            'user-id': userId,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsStarred(true);
          setStarCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('操作收藏失败:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      {isAuthenticated && userId && (
        <button
          onClick={handleStarToggle}
          disabled={loading}
          className={`flex items-center space-x-1 ${
            isStarred ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400'
          } ${loading ? 'opacity-50' : ''}`}
        >
          {isStarred ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
          <span className="dark:text-gray-300">{isStarred ? '已收藏' : '收藏'}</span>
        </button>
      )}
      <Link 
        href={`/gists/${gistId}/export`} 
        className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="dark:text-gray-300">导出</span>
      </Link>
    </div>
  );
}