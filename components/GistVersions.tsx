// components/GistVersions.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GistVersion } from '../lib/gists';

interface GistVersionsProps {
  gistId: string;
}

export default function GistVersions({ gistId }: GistVersionsProps) {
  const [versions, setVersions] = useState<GistVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch(`/api/gists/${gistId}/versions`);
        if (!response.ok) {
          throw new Error('获取版本历史失败');
        }
        const data = await response.json();
        setVersions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [gistId]);

  if (loading) {
    return <div className="text-center py-4 dark:text-gray-300">加载版本历史...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500 dark:text-red-400">错误: {error}</div>;
  }

  if (versions.length === 0) {
    return <div className="text-center py-4 text-gray-500 dark:text-gray-400">暂无版本历史</div>;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 dark:text-white">版本历史</h3>
      <div className="border border-gray-200 rounded-md overflow-hidden dark:border-gray-700">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {versions.map((version) => (
            <li key={version.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex justify-between items-center">
                <Link 
                  href={`/gists/${gistId}/versions/${version.version_number}`}
                  className="text-blue-600 hover:underline font-mono dark:text-blue-400 dark:hover:text-blue-300"
                >
                  版本 #{version.version_number}
                </Link>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(version.created_at).toLocaleString('zh-CN')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}