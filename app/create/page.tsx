// app/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getMonacoLanguage, getLanguageByValue } from '@/lib/language-support';
import ProtectedRoute from '@/components/ProtectedRoute';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center code-container">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>加载编辑器...</p>
      </div>
    </div>
  )
});

export default function CreateGistPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('file.txt');
  const [fileContent, setFileContent] = useState('');
  const [language, setLanguage] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      console.log('用户未登录');
    }
  }, []);

  // 根据文件名后缀自动检测语言
  useEffect(() => {
    const detectLanguageFromExtension = (filename: string) => {
      const extension = filename.split('.').pop()?.toLowerCase() || '';
      
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
      
      return extensionMap[extension] || 'text';
    };
    
    const detectedLanguage = detectLanguageFromExtension(fileName);
    setLanguage(detectedLanguage);
  }, [fileName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const currentFileContent = fileContent || '';
    
    try {
      const userInfo = localStorage.getItem('userInfo');
      const userId = userInfo ? JSON.parse(userInfo).id : null;
      
      if (!title.trim()) {
        setError('标题不能为空');
        setIsSubmitting(false);
        return;
      }
      
      if (!currentFileContent.trim()) {
        setError('文件内容不能为空');
        setIsSubmitting(false);
        return;
      }
      
      if (!fileName.trim()) {
        setError('文件名不能为空');
        setIsSubmitting(false);
        return;
      }
      
      const response = await fetch('/api/gists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          files: [{
            filename: fileName,
            content: currentFileContent,
            language
          }],
          user_id: userId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建 Gist 失败');
      }
      
      const newGist = await response.json();
      router.push(`/gists/${newGist.id}`);
      router.refresh();
    } catch (err) {
      setError('创建 Gist 时出错: ' + (err as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container-main py-6">
        <div className="gist-card">
          {/* 头部 */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>新建 Gist</h1>
          </div>
          
          {error && (
            <div className="mx-4 mt-4 p-3 rounded-md text-sm" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4">
            {/* 标题 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                标题 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm"
                placeholder="为你的 Gist 添加一个标题"
                required
              />
            </div>

            {/* 描述 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                描述 (可选)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm"
                placeholder="描述这个 Gist 的用途"
                rows={2}
              />
            </div>

            {/* 文件名 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                文件名
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 text-sm"
                placeholder="文件名，例如: hello.js"
              />
            </div>

            {/* 代码编辑器 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                文件内容
              </label>
              <div className="code-container overflow-hidden">
                <div className="h-96">
                  <MonacoEditor
                    height="100%"
                    language={getMonacoLanguage(language)}
                    value={fileContent}
                    onChange={(value) => setFileContent(value || '')}
                    theme={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs-light'}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'on',
                      tabSize: 2,
                      insertSpaces: true,
                      fontFamily: "Consolas, 'Liberation Mono', Menlo, monospace",
                    }}
                  />
                </div>
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                语言: {getLanguageByValue(language).label} · 内容长度: {fileContent.length}
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex justify-end gap-3">
              <a
                href="/"
                className="btn-outline px-4 py-2"
              >
                取消
              </a>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-4 py-2"
              >
                {isSubmitting ? '创建中...' : '创建 Gist'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
