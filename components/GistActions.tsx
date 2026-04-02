'use client';

import { useState, useEffect, useRef } from 'react';

type EmbedTheme = 'auto' | 'light' | 'dark';

interface GistActionsProps {
  gistId: string;
  gistUserId?: string;
  nbLikes?: number;
  nbForks?: number;
}

export default function GistActions({ gistId, gistUserId, nbLikes = 0, nbForks = 0 }: GistActionsProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmbed, setShowEmbed] = useState(false);
  const [hasForked, setHasForked] = useState(false);
  const [forkId, setForkId] = useState<string | null>(null);
  const [forking, setForking] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [embedTheme, setEmbedTheme] = useState<EmbedTheme>('auto');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    const token = localStorage.getItem('userToken');
    if (!userInfo || !token) {
      setLoading(false);
      return;
    }

    const user = JSON.parse(userInfo);
    setCurrentUserId(user.id);

    const fetchData = async () => {
      try {
        // 获取收藏状态
        const [starRes, forkRes] = await Promise.all([
          fetch(`/api/gists/${gistId}/star`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/gists/${gistId}/fork`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (starRes.ok) {
          const starData = await starRes.json();
          setIsStarred(starData.isStarred);
        }

        if (forkRes.ok) {
          const forkData = await forkRes.json();
          setHasForked(forkData.hasForked);
          setForkId(forkData.forkId);
        }
      } catch (error) {
        console.error('获取状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gistId]);

  const handleStarToggle = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      window.location.href = `/login?redirect=/gists/${gistId}`;
      return;
    }

    try {
      if (isStarred) {
        const response = await fetch(`/api/gists/${gistId}/star`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsStarred(false);
        }
      } else {
        const response = await fetch(`/api/gists/${gistId}/star`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsStarred(true);
        }
      }
    } catch (error) {
      console.error('操作收藏失败:', error);
    }
  };

  const handleFork = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      window.location.href = `/login?redirect=/gists/${gistId}`;
      return;
    }

    // 不能 fork 自己的 Gist
    if (gistUserId === currentUserId) {
      alert('您不能 fork 自己的 Gist');
      return;
    }

    if (hasForked && forkId) {
      // 已经 fork 过，跳转到 fork 的版本
      window.location.href = `/gists/${forkId}`;
      return;
    }

    setForking(true);
    try {
      const response = await fetch(`/api/gists/${gistId}/fork`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const forkedGist = await response.json();
        setHasForked(true);
        setForkId(forkedGist.id);
        // 跳转到 fork 的 Gist
        window.location.href = `/gists/${forkedGist.id}`;
      } else {
        const error = await response.json();
        alert(error.error || 'Fork 失败');
      }
    } catch (error) {
      console.error('Fork 失败:', error);
      alert('Fork 失败，请稍后重试');
    } finally {
      setForking(false);
    }
  };

  // 生成 embed 代码
  const getEmbedCode = (theme: EmbedTheme) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const themeParam = theme === 'auto' ? '' : `?theme=${theme}`;
    return `<div id="sify-gist-${gistId}"></div>\n<script src="${origin}/api/gists/${gistId}/embed.js${themeParam}"></script>`;
  };

  const embedCode = getEmbedCode(embedTheme);

  // 渲染预览
  useEffect(() => {
    if (showEmbed && previewRef.current) {
      // 清空预览容器
      previewRef.current.innerHTML = '';
      
      // 创建 gist 容器
      const container = document.createElement('div');
      container.id = `sify-gist-${gistId}-preview`;
      previewRef.current.appendChild(container);
      
      // 创建并加载脚本
      const origin = window.location.origin;
      const themeParam = embedTheme === 'auto' ? '' : `?theme=${embedTheme}`;
      const script = document.createElement('script');
      script.src = `${origin}/api/gists/${gistId}/embed.js${themeParam}`;
      script.onload = () => {
        // 脚本加载后，查找渲染的内容并移动到预览容器
        const renderedGist = document.querySelector('.sify-gist-container');
        if (renderedGist && previewRef.current) {
          // 如果不是在预览容器内，移动进去
          if (!previewRef.current.contains(renderedGist)) {
            previewRef.current.innerHTML = '';
            previewRef.current.appendChild(renderedGist.cloneNode(true));
            renderedGist.remove();
          }
        }
      };
      
      // 使用 setTimeout 确保容器已准备好
      setTimeout(() => {
        document.body.appendChild(script);
      }, 100);
      
      // 清理函数
      return () => {
        // 移除可能残留的 embed 内容
        const existingGist = document.querySelector('.sify-gist-container');
        if (existingGist && !previewRef.current?.contains(existingGist)) {
          existingGist.remove();
        }
      };
    }
  }, [showEmbed, embedTheme, gistId]);

  // 切换主题时重新加载预览
  useEffect(() => {
    if (showEmbed && previewRef.current) {
      // 清空并重新渲染
      previewRef.current.innerHTML = '<div class="text-gray-500 italic text-sm p-4">Loading preview...</div>';
      
      // 移除旧的 embed 内容
      const existingGist = document.querySelector('.sify-gist-container');
      if (existingGist) {
        existingGist.remove();
      }
      
      // 创建新容器
      const container = document.createElement('div');
      container.id = `sify-gist-${gistId}-preview`;
      previewRef.current.innerHTML = '';
      previewRef.current.appendChild(container);
      
      // 加载脚本
      const origin = window.location.origin;
      const themeParam = embedTheme === 'auto' ? '' : `?theme=${embedTheme}`;
      const script = document.createElement('script');
      script.src = `${origin}/api/gists/${gistId}/embed.js${themeParam}`;
      document.body.appendChild(script);
    }
  }, [embedTheme]);

  return (
    <>
      <div className="gist-actions flex items-center gap-2">
        <button
          onClick={handleStarToggle}
          disabled={loading}
          className="btn btn-sm flex items-center gap-1"
          style={isStarred ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill={isStarred ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {isStarred ? 'Starred' : 'Star'}
        </button>

        <button 
          onClick={handleFork}
          disabled={loading || forking || gistUserId === currentUserId}
          className="btn btn-sm flex items-center gap-1"
          style={hasForked ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
          title={gistUserId === currentUserId ? '不能 fork 自己的 Gist' : hasForked ? '查看已 fork 的版本' : 'Fork 这个 Gist'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {forking ? 'Forking...' : hasForked ? 'Forked' : 'Fork'}
        </button>

        <button 
          onClick={() => setShowEmbed(true)}
          className="btn btn-sm flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Embed
        </button>
      </div>

      {/* Embed Modal */}
      {showEmbed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="card-header flex items-center justify-between flex-shrink-0">
              <h3 className="font-semibold">Embed this gist</h3>
              <button onClick={() => setShowEmbed(false)} className="btn btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="card-body space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="form-label text-sm font-medium">Theme</label>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setEmbedTheme('auto')}
                    className={`btn btn-sm ${embedTheme === 'auto' ? 'btn-primary' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Auto
                  </button>
                  <button
                    onClick={() => setEmbedTheme('light')}
                    className={`btn btn-sm ${embedTheme === 'light' ? 'btn-primary' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Light
                  </button>
                  <button
                    onClick={() => setEmbedTheme('dark')}
                    className={`btn btn-sm ${embedTheme === 'dark' ? 'btn-primary' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Dark
                  </button>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  {embedTheme === 'auto' 
                    ? 'Auto: Follows the system theme preference (prefers-color-scheme)' 
                    : embedTheme === 'light' 
                      ? 'Light: Always use light theme' 
                      : 'Dark: Always use dark theme'}
                </p>
              </div>
              
              <div>
                <label className="form-label text-sm font-medium">Embed code</label>
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Copy this code and paste it into your HTML to embed this gist.</p>
                <textarea 
                  readOnly 
                  value={embedCode}
                  className="form-input font-mono text-xs w-full"
                  rows={3}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
              
              <div>
                <label className="form-label text-sm font-medium">Preview</label>
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>This is how your embedded gist will look.</p>
                <div 
                  ref={previewRef}
                  className="border rounded overflow-auto max-h-80"
                  style={{ 
                    borderColor: 'var(--color-border)',
                    backgroundColor: embedTheme === 'dark' ? '#0d1117' : embedTheme === 'light' ? '#ffffff' : undefined
                  }}
                >
                  <div className="p-4 text-sm italic" style={{ color: 'var(--color-text-muted)' }}>Loading preview...</div>
                </div>
              </div>
            </div>
            <div className="card-footer flex justify-end gap-2 flex-shrink-0">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(embedCode);
                }}
                className="btn btn-primary btn-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Embed Code
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
