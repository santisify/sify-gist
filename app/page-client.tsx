'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Pagination from '@/components/Pagination';

interface GistFile {
  id?: number;
  gist_id?: string;
  filename: string;
  content: string;
  language: string;
}

interface GistUser {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Gist {
  id: string;
  user_id?: string;
  title?: string;
  description?: string;
  visibility: 'public' | 'unlisted' | 'private';
  created_at: string;
  updated_at: string;
  files: GistFile[];
  user?: GistUser;
}

interface PaginatedResult {
  data: Gist[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function HomePageClient() {
  const [result, setResult] = useState<PaginatedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const page = parseInt(searchParams.get('page') || '1', 10);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 获取 Gists
  const fetchGists = useCallback(async () => {
    setIsLoading(true);
    
    const token = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');
    setIsAuthenticated(!!(token && userInfo));
    
    try {
      const currentUserId = userInfo ? JSON.parse(userInfo).id : null;
      let url = `/api/gists?page=${page}&limit=10`;
      
      if (debouncedQuery) {
        url += `&q=${encodeURIComponent(debouncedQuery)}`;
      }
      
      if (currentUserId) {
        url += `&currentUserId=${currentUserId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error('获取 gists 时出错:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedQuery]);

  useEffect(() => {
    fetchGists();
  }, [fetchGists]);

  // 搜索时重置页码
  useEffect(() => {
    if (debouncedQuery && page !== 1) {
      router.push('/');
    }
  }, [debouncedQuery]);

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login?redirect=/create');
    } else {
      router.push('/create');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery !== debouncedQuery) {
      setDebouncedQuery(searchQuery);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (debouncedQuery) {
      params.set('q', debouncedQuery);
    }
    params.set('page', newPage.toString());
    router.push(`/?${params.toString()}`);
  };

  function getTimeAgo(dateStr: string): string {
    // 数据库存储的是 UTC 时间，确保正确解析
    // 如果时间字符串没有 Z 后缀，添加 Z 表示 UTC
    const utcStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
    const date = new Date(utcStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getFileCount(files: GistFile[]): string {
    const count = files.length;
    return count === 1 ? '1 file' : `${count} files`;
  }

  function getPreviewLines(content: string, maxLines: number): { content: string; truncated: boolean; totalLines: number } {
    const lines = content.split('\n');
    const totalLines = lines.length;
    if (totalLines > maxLines) {
      return {
        content: lines.slice(0, maxLines).join('\n'),
        truncated: true,
        totalLines
      };
    }
    return {
      content,
      truncated: false,
      totalLines
    };
  }

  function getVisibilityBadge(visibility: string) {
    switch (visibility) {
      case 'private':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            私有
          </span>
        );
      case 'unlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            未列出
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="container-main py-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-main)' }}>
            {debouncedQuery ? `搜索: "${debouncedQuery}"` : 'All gists'}
          </h1>
          {!isLoading && result && (
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {result.total}
            </span>
          )}
        </div>
        <button onClick={handleCreateClick} className="btn btn-primary btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New gist
        </button>
      </div>

      {/* 搜索框 */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索 Gists..."
            className="w-full pl-10 pr-4 py-2 text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : result?.data.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h3 className="empty-state-title">
              {debouncedQuery ? '未找到匹配的 Gists' : 'No gists yet'}
            </h3>
            <p className="empty-state-desc">
              {debouncedQuery ? '尝试其他搜索词' : 'Create your first gist to get started'}
            </p>
            {!debouncedQuery && (
              <button onClick={handleCreateClick} className="btn btn-primary mt-4">
                Create a gist
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="gist-cards-grid">
          {result?.data.map((gist) => (
            <GistCard
              key={gist.id}
              gist={gist}
              router={router}
              getTimeAgo={getTimeAgo}
              getFileCount={getFileCount}
              getPreviewLines={getPreviewLines}
              getVisibilityBadge={getVisibilityBadge}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {!isLoading && result && result.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={result.page}
            totalPages={result.totalPages}
            total={result.total}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

// 语言颜色映射
const languageColors: Record<string, string> = {
  'JavaScript': 'lang-js',
  'TypeScript': 'lang-ts',
  'Python': 'lang-python',
  'Ruby': 'lang-ruby',
  'Java': 'lang-java',
  'Go': 'lang-go',
  'Rust': 'lang-rust',
  'C': 'lang-c',
  'C++': 'lang-cpp',
  'PHP': 'lang-php',
  'HTML': 'lang-html',
  'CSS': 'lang-css',
  'JSON': 'lang-json',
  'Markdown': 'lang-markdown',
  'Shell': 'lang-shell',
  'Vue': 'lang-vue',
  'Svelte': 'lang-svelte',
  'Swift': 'lang-swift',
  'Kotlin': 'lang-kotlin',
  'SQL': 'lang-sql',
  'YAML': 'lang-yaml',
  'Dockerfile': 'lang-dockerfile',
};

// 语言名称映射到 SyntaxHighlighter 支持的格式
const languageMap: Record<string, string> = {
  'JavaScript': 'javascript',
  'TypeScript': 'typescript',
  'Python': 'python',
  'Ruby': 'ruby',
  'Java': 'java',
  'Go': 'go',
  'Rust': 'rust',
  'C': 'c',
  'C++': 'cpp',
  'PHP': 'php',
  'HTML': 'html',
  'CSS': 'css',
  'JSON': 'json',
  'Markdown': 'markdown',
  'Shell': 'bash',
  'Vue': 'vue',
  'Svelte': 'svelte',
  'Swift': 'swift',
  'Kotlin': 'kotlin',
  'SQL': 'sql',
  'YAML': 'yaml',
  'Dockerfile': 'dockerfile',
  'Text': 'text',
};

function getLanguageClass(language: string): string {
  return languageColors[language] || '';
}

function getHighlightLanguage(language: string): string {
  return languageMap[language] || 'text';
}

// Gist 卡片组件
function GistCard({
  gist,
  router,
  getTimeAgo,
  getFileCount,
  getPreviewLines,
  getVisibilityBadge,
}: {
  gist: Gist;
  router: ReturnType<typeof useRouter>;
  getTimeAgo: (dateStr: string) => string;
  getFileCount: (files: GistFile[]) => string;
  getPreviewLines: (content: string, maxLines: number) => { content: string; truncated: boolean; totalLines: number };
  getVisibilityBadge: (visibility: string) => React.ReactNode;
}) {
  const firstFile = gist.files[0];
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 获取预览内容
  const preview = firstFile?.content ? getPreviewLines(firstFile.content, 10) : null;

  return (
    <div className="gist-card">
      {/* 卡片头部 */}
      <Link href={`/gists/${gist.id}`} className="gist-card-header">
        <div className="flex-1 min-w-0">
          <div className="gist-card-title">
            {gist.title || 'Untitled'}
          </div>
          {gist.description && (
            <p className="gist-card-desc">{gist.description}</p>
          )}
        </div>
        {getVisibilityBadge(gist.visibility)}
      </Link>

      {/* 元信息 */}
      <div className="gist-card-meta">
        {gist.user && (
          <span className="gist-card-user">
            {gist.user.avatar_url ? (
              <img src={gist.user.avatar_url} alt="" className="gist-card-user-avatar" />
            ) : (
              <div className="gist-card-user-avatar-placeholder">
                {gist.user.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <span>{gist.user.name}</span>
          </span>
        )}
        <span className="gist-card-files">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {getFileCount(gist.files)}
        </span>
        <span className="gist-card-time">{getTimeAgo(gist.updated_at)}</span>
      </div>

      {/* 代码预览 */}
      {preview && (
        <div
          className="gist-card-preview cursor-pointer"
          onClick={() => router.push(`/gists/${gist.id}`)}
        >
          <div className="gist-card-preview-header">
            <span className="gist-card-preview-filename">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {firstFile.filename}
            </span>
            <span className={`lang-badge ${getLanguageClass(firstFile.language)}`}>
              <span className="lang-badge-dot"></span>
              {firstFile.language}
            </span>
          </div>
          <div className="gist-card-preview-code">
            <SyntaxHighlighter
              language={getHighlightLanguage(firstFile.language)}
              style={isDark ? oneDark : oneLight}
              customStyle={{
                margin: 0,
                padding: 0,
                background: 'transparent',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
                }
              }}
              showLineNumbers={true}
              lineNumberStyle={{
                minWidth: '2.5em',
                paddingRight: '1em',
                color: isDark ? '#6e7681' : '#9e9e9e',
                textAlign: 'right',
                userSelect: 'none',
              }}
            >
              {preview.content}
            </SyntaxHighlighter>
            {preview.truncated && (
              <div className="gist-card-preview-more">
                <span>显示前 10 行，共 {preview.totalLines} 行</span>
                <span className="gist-card-preview-more-link">查看完整代码 →</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
