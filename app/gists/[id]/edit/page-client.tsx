// app/gists/[id]/edit/page-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getMonacoLanguage, getLanguageByValue } from '@/lib/language-support';
import ProtectedRoute from '@/components/ProtectedRoute';

// 动态导入 Monaco Editor
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 border border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p>加载代码编辑器中...</p>
        <p className="text-xs text-gray-500 mt-1">如果长时间加载，请刷新页面</p>
      </div>
    </div>
  )
});

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

export default function EditGistPageClient() {
  const params = useParams();
  const router = useRouter();
  const [gist, setGist] = useState<Gist | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('file.txt');
  const [fileContent, setFileContent] = useState('');
  const [language, setLanguage] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载现有的 Gist 数据
  useEffect(() => {
    const fetchGist = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/gists/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setGist(data);
          // 设置表单初始值
          setTitle(data.title || '');
          setDescription(data.description || '');
          if (data.files && data.files.length > 0) {
            const firstFile = data.files[0];
            setFileName(firstFile.filename);
            setFileContent(firstFile.content);
            setLanguage(firstFile.language || 'text');
          }
        } else {
          setError('获取 Gist 失败: ' + response.statusText);
        }
      } catch (error) {
        console.error('获取 Gist 时出错:', error);
        setError('获取 Gist 时出错: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchGist();
    }
  }, [params.id]);

  // 根据文件名后缀自动检测语言
  useEffect(() => {
    const detectLanguageFromExtension = (filename: string) => {
      const extension = filename.split('.').pop()?.toLowerCase() || '';
      
      // 常见的文件扩展名映射
      const extensionMap: Record<string, string> = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'java': 'java',
        'html': 'html',
        'htm': 'html',
        'css': 'css',
        'json': 'json',
        'yaml': 'yaml',
        'yml': 'yaml',
        'md': 'markdown',
        'markdown': 'markdown',
        'sh': 'bash',
        'bash': 'bash',
        'sql': 'sql',
        'go': 'go',
        'rs': 'rust',
        'php': 'php',
        'cs': 'csharp',
        'cpp': 'cpp',
        'c': 'c',
        'h': 'c',
        'hpp': 'cpp',
        'kt': 'kotlin',
        'swift': 'swift',
        'rb': 'ruby',
        'scala': 'scala',
        'pl': 'perl',
        'r': 'r',
        'dart': 'dart',
        'ex': 'elixir',
        'exs': 'elixir',
        'erl': 'erlang',
        'hs': 'haskell',
        'lua': 'lua',
        'ps1': 'powershell',
        'psm1': 'powershell',
        'Dockerfile': 'dockerfile',
        'xml': 'xml',
        'graphql': 'graphql',
        'gql': 'graphql',
        'toml': 'toml',
        'txt': 'text',
        'log': 'text',
      };
      
      return extensionMap[extension] || 'text'; // 默认为text
    };
    
    const detectedLanguage = detectLanguageFromExtension(fileName);
    setLanguage(detectedLanguage);
  }, [fileName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 验证必需字段
      if (!title.trim()) {
        setError('标题不能为空');
        setIsSubmitting(false);
        return;
      }
      
      if (!fileContent.trim()) {
        setError('文件内容不能为空');
        setIsSubmitting(false);
        return;
      }
      
      if (!fileName.trim()) {
        setError('文件名不能为空');
        setIsSubmitting(false);
        return;
      }
      
      // 通过 API 调用更新 Gist
      const response = await fetch(`/api/gists/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          files: [{
            filename: fileName,
            content: fileContent,
            language
          }]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新 Gist 失败');
      }
      
      const updatedGist = await response.json();
      
      console.log('成功更新 Gist:', updatedGist.id); // 调试日志
      router.push(`/gists/${updatedGist.id}`);
      router.refresh();
    } catch (err) {
      console.error('更新 Gist 失败:', err); // 调试日志
      setError('更新 Gist 时出错: ' + (err as Error).message);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">错误</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!gist) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Gist 不存在</h3>
          <p className="mt-1 text-sm text-gray-500">请检查 Gist ID 是否正确</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑 Gist</h1>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                标题 *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="为你的 Gist 添加一个标题"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                描述 (可选)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="描述这个 Gist 的用途"
                rows={2}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-1">
                文件名
              </label>
              <input
                type="text"
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="文件名，例如: hello.js"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文件内容
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden relative">
                <div className="h-96">
                  <MonacoEditor
                    height="100%"
                    language={getMonacoLanguage(language)}
                    value={fileContent}
                    onChange={(value) => {
                      setFileContent(value || '');
                      console.log('Editor content changed:', value?.substring(0, 50)); // 调试日志
                    }}
                    theme="vs-light"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'on',
                      tabSize: 2,
                      insertSpaces: true,
                    }}
                  />
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-500">
                检测到的语言: {getLanguageByValue(language).label} | 内容长度: {fileContent.length}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? '更新中...' : '更新 Gist'}
              </button>
              <a
                href={`/gists/${params.id}`}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                取消
              </a>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}