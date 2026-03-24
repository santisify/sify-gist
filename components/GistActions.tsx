'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GistActionsProps {
  gistId: string;
  gistUserId?: string;
  starsCount?: number;
  forksCount?: number;
}

export default function GistActions({ gistId, gistUserId, starsCount = 0, forksCount = 0 }: GistActionsProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmbed, setShowEmbed] = useState(false);
  const [hasForked, setHasForked] = useState(false);
  const [forkId, setForkId] = useState<string | null>(null);
  const [forking, setForking] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
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
            headers: { 'user-id': user.id }
          }),
          fetch(`/api/gists/${gistId}/fork`, {
            headers: { 'user-id': user.id }
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
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      window.location.href = `/login?redirect=/gists/${gistId}`;
      return;
    }

    const user = JSON.parse(userInfo);

    try {
      if (isStarred) {
        const response = await fetch(`/api/gists/${gistId}/star`, {
          method: 'DELETE',
          headers: {
            'user-id': user.id,
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
            'user-id': user.id,
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
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      window.location.href = `/login?redirect=/gists/${gistId}`;
      return;
    }

    const user = JSON.parse(userInfo);

    // 不能 fork 自己的 Gist
    if (gistUserId === user.id) {
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
          'user-id': user.id,
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

  const embedCode = `<div id="sify-gist-${gistId}"></div>\n<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/gists/${gistId}/embed.js"></script>`;

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
          <div className="card w-full max-w-lg">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold">Embed this gist</h3>
              <button onClick={() => setShowEmbed(false)} className="btn btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="form-label text-sm font-medium">Embed code</label>
                <p className="text-xs text-gray-500 mb-2">Copy this code and paste it into your HTML to embed this gist.</p>
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
                <p className="text-xs text-gray-500 mb-2">This is how your embedded gist will look.</p>
                <div 
                  id={`sify-gist-${gistId}-preview`}
                  className="border rounded p-4 bg-gray-50 text-sm"
                >
                  <div className="text-gray-500 italic">Preview will appear when the embed script loads.</div>
                </div>
              </div>
            </div>
            <div className="card-footer flex justify-end gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(embedCode);
                  alert('Copied to clipboard!');
                }}
                className="btn btn-primary btn-sm"
              >
                Copy Embed Code
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
