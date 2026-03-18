// app/gists/[id]/page-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import GistDisplay from '../../../components/GistDisplay';
import GistActions from '../../../components/GistActions';

interface File {
  id?: number;
  gist_id?: string;
  filename: string;
  content: string;
  language: string;
}

interface Gist {
  id: string;
  user_id?: string;
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  files: File[];
}

export default function GistPageClient() {
  const params = useParams();
  const [gist, setGist] = useState<Gist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 检查认证状态
    const token = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
      setIsAuthenticated(true);
      try {
        const user = JSON.parse(userInfo);
        setUserId(user.id);
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    } else {
      setIsAuthenticated(false);
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    const fetchGist = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/gists/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setGist(data);
        } else {
          console.error('获取 Gist 失败:', response.statusText);
        }
      } catch (error) {
        console.error('获取 Gist 时出错:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchGist();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4 dark:border-blue-400"></div>
          <p className="dark:text-gray-300">加载中...</p>
        </div>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gist 不存在</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">请检查 Gist ID 是否正确</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden dark:bg-gray-800 dark:shadow-gray-900/20">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{gist.title || '未命名 Gist'}</h1>
          {gist.description && (
            <p className="text-gray-600 mt-2 dark:text-gray-300">{gist.description}</p>
          )}
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            创建于 {new Date(gist.created_at).toLocaleString('zh-CN')}
            {gist.updated_at !== gist.created_at && (
              <span> · 更新于 {new Date(gist.updated_at).toLocaleString('zh-CN')}</span>
            )}
          </div>
          <GistActions 
            gistId={gist.id} 
            isAuthenticated={isAuthenticated} 
            userId={userId} 
          />
        </div>
        <div className="p-5">
          <GistDisplay gist={gist} />
        </div>
      </div>
    </div>
  );
}