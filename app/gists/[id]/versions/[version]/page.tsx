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
      <div className="bg-white rounded-lg shadow-md overflow-hidden dark:bg-gray-800 dark:shadow-gray-900/20">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {gist.title || '未命名 Gist'} (版本 #{versionNumber})
          </h1>
          {gist.description && (
            <p className="text-gray-600 mt-2 dark:text-gray-300">{gist.description}</p>
          )}
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            版本 #{versionNumber} 创建于 {new Date(gist.created_at).toLocaleString('zh-CN')}
          </div>
        </div>
        <div className="p-5">
          {gist.files.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-gray-700/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">该版本文件内容未保存</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                此版本是在版本功能完善前创建的，文件内容未被记录。
              </p>
              <a 
                href={`/gists/${params.id}`} 
                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                查看当前版本
              </a>
            </div>
          ) : (
            <GistDisplay gist={gist} />
          )}
        </div>
      </div>
    </div>
  );
}