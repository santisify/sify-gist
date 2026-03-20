// app/gists/[id]/page-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import GistDisplay from '../../../components/GistDisplay';
import GistActions from '../../../components/GistActions';
import GistVersions from '../../../components/GistVersions';

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
      <div className="container-main py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>加载中...</p>
        </div>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="container-main py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium" style={{ color: 'var(--color-text-main)' }}>Gist 不存在</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>请检查 Gist ID 是否正确</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main py-6">
      {/* Gist 头部信息 */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
              {gist.title || '未命名 Gist'}
            </h1>
            {gist.description && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{gist.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <span>创建于 {new Date(gist.created_at).toLocaleString('zh-CN')}</span>
              {gist.updated_at !== gist.created_at && (
                <span>· 更新于 {new Date(gist.updated_at).toLocaleString('zh-CN')}</span>
              )}
            </div>
          </div>
          <GistActions 
            gistId={gist.id} 
            isAuthenticated={isAuthenticated} 
            userId={userId} 
          />
        </div>
      </div>

      {/* 代码区域 */}
      <div className="gist-card overflow-hidden">
        <GistDisplay gist={gist} />
      </div>
      
      {/* 版本历史 */}
      <div className="mt-6">
        <GistVersions gistId={gist.id} />
      </div>
    </div>
  );
}
