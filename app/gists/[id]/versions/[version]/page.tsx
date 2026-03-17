// app/gists/[id]/versions/[version]/page.tsx
import { notFound } from 'next/navigation';
import { getGistByVersion } from '@/lib/gists';
import GistDisplay from '@/components/GistDisplay';
import { initializeDatabase } from '@/app/init-db';

async function ensureDbInitialized() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('数据库初始化错误:', error);
    throw error;
  }
}

export default async function GistVersionPage({ 
  params 
}: { 
  params: { id: string; version: string } 
}) {
  await ensureDbInitialized();
  
  const versionNumber = parseInt(params.version, 10);
  
  if (isNaN(versionNumber)) {
    notFound();
  }

  let gist;
  try {
    gist = await getGistByVersion(params.id, versionNumber);
  } catch (error) {
    console.error('获取 Gist 版本失败:', error);
    notFound();
  }

  if (!gist) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            {gist.title || '未命名 Gist'} (版本 #{versionNumber})
          </h1>
          {gist.description && (
            <p className="text-gray-600 mt-2">{gist.description}</p>
          )}
          <div className="mt-3 text-sm text-gray-500">
            版本 #{versionNumber} 创建于 {new Date(gist.created_at).toLocaleString('zh-CN')}
          </div>
        </div>
        <div className="p-5">
          <GistDisplay gist={gist} />
        </div>
      </div>
    </div>
  );
}