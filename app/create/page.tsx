// app/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getMonacoLanguage, getLanguageByValue } from '@/lib/language-support';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Visibility } from '@/lib/gists';

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
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [fileName, setFileName] = useState('file.txt');
  const [fileContent, setFileContent] = useState('');
  const [language, setLanguage] = useState('text');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
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
        'csv': 'csv',
      };
      
      return extensionMap[extension] || 'text';
    };
    
    const detectedLanguage = detectLanguageFromExtension(fileName);
    setLanguage(detectedLanguage);
  }, [fileName]);

  const handleAddTopic = () => {
    const topic = topicInput.trim().toLowerCase();
    if (topic && !topics.includes(topic) && topics.length < 5) {
      setTopics([...topics, topic]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };

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
          visibility,
          files: [{
            filename: fileName,
            content: currentFileContent,
            language
          }],
          user_id: userId,
          topics
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

            {/* 标签 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-main)' }}>
                标签 (最多 5 个)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={handleTopicKeyDown}
                  className="flex-1 px-3 py-2 text-sm"
                  placeholder="输入标签后按 Enter 或点击添加"
                  disabled={topics.length >= 5}
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  disabled={!topicInput.trim() || topics.length >= 5}
                  className="btn btn-sm"
                >
                  添加
                </button>
              </div>
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(topic)}
                        className="hover:opacity-75"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                标签可以帮助其他人发现您的 Gist，例如: javascript, python, tutorial
              </p>
            </div>

            {/* 可见性选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>
                可见性
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      公开
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      所有人可见
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="unlisted"
                    checked={visibility === 'unlisted'}
                    onChange={() => setVisibility('unlisted')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      未列出
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      仅通过链接可访问
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text-main)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      私有
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      仅自己可见
                    </div>
                  </div>
                </label>
              </div>
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