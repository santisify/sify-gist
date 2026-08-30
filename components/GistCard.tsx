'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Gist } from '@/lib/gists';
import { getTimeAgo, getFileCount, getPreviewLines } from '@/lib/format';
import { getLanguageBadgeClass, getLanguageLabel, getPrismLanguage } from '@/lib/language-support';
import VisibilityBadge from '@/lib/visibility-badge';

interface GistCardProps {
  gist: Gist;
  /** When true, render a syntax-highlighted code preview of the first file. */
  showCodePreview?: boolean;
  /** Compact variant used in discover/grid layouts (no code preview). */
  compact?: boolean;
}

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function GistCard({ gist, showCodePreview = false, compact = false }: GistCardProps) {
  const isDark = useIsDark();
  const firstFile = gist.files?.[0];
  const preview = showCodePreview && firstFile?.content ? getPreviewLines(firstFile.content, 10) : null;
  const visibility = typeof gist.visibility === 'number' ? gist.visibility : (gist.visibility as 'public' | 'unlisted' | 'private');

  if (compact) {
    return (
      <Link href={`/gists/${gist.id}`} className="block">
        <div className="card h-full">
          <div className="p-4">
            <div className="flex items-start justify-between mb-2 gap-3">
              <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                {gist.title || 'Untitled'}
              </h3>
              <VisibilityBadge visibility={visibility} />
            </div>

            {gist.description && (
              <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                {gist.description}
              </p>
            )}

            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {gist.files?.slice(0, 3).map((file, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
                  style={{ background: 'var(--color-bg-code)', color: 'var(--color-text-secondary)' }}
                >
                  {file.filename}
                </span>
              ))}
              {(gist.files?.length ?? 0) > 3 && (
                <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                  +{(gist.files?.length ?? 0) - 3}
                </span>
              )}
            </div>

            {gist.topics && gist.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {gist.topics.slice(0, 4).map(topic => (
                  <span
                    key={topic}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono"
                    style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {getTimeAgo(gist.created_at)}
              </span>
              <div className="flex items-center gap-3 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {(gist.nb_likes ?? 0) > 0 && <span>★ {gist.nb_likes}</span>}
                {(gist.nb_forks ?? 0) > 0 && <span>⑂ {gist.nb_forks}</span>}
                <span>{getFileCount(gist.files?.length ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="gist-card">
      {/* Header */}
      <Link href={`/gists/${gist.id}`} className="gist-card-header block">
        <div className="flex-1 min-w-0">
          <div className="gist-card-title">
            {gist.title || 'Untitled'}
          </div>
          {gist.description && <p className="gist-card-desc">{gist.description}</p>}
        </div>
        <VisibilityBadge visibility={visibility} />
      </Link>

      {/* Meta */}
      <div className="gist-card-meta">
        {gist.user && (
          <Link href={`/users/${gist.user.id}`} className="gist-card-user hover:opacity-80">
            {gist.user.avatar_url ? (
              <img src={gist.user.avatar_url} alt="" className="gist-card-user-avatar" />
            ) : (
              <span className="gist-card-user-avatar-placeholder">
                {gist.user.name?.charAt(0).toUpperCase()}
              </span>
            )}
            <span>{gist.user.name}</span>
          </Link>
        )}
        <span className="gist-card-files">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {getFileCount(gist.files?.length ?? 0)}
        </span>
        <span className="gist-card-time">{getTimeAgo(gist.updated_at)}</span>
      </div>

      {/* Code preview */}
      {preview && firstFile && (
        <Link href={`/gists/${gist.id}`} className="gist-card-preview block">
          <div className="gist-card-preview-header">
            <span className="gist-card-preview-filename">
              <span className="code-dots" />
              {firstFile.filename}
            </span>
            <span className={`lang-badge ${getLanguageBadgeClass(firstFile.language)}`}>
              <span className="lang-badge-dot" />
              {getLanguageLabel(firstFile.language)}
            </span>
          </div>
          <div className="gist-card-preview-code">
            <SyntaxHighlighter
              language={getPrismLanguage(firstFile.language)}
              style={isDark ? oneDark : oneLight}
              customStyle={{
                margin: 0,
                padding: '14px 20px',
                background: 'transparent',
                fontSize: '13px',
                lineHeight: '1.7',
              }}
              codeTagProps={{
                style: { fontFamily: "'JetBrains Mono', monospace" },
              }}
              showLineNumbers={true}
              lineNumberStyle={{
                minWidth: '2.5em',
                paddingRight: '1em',
                color: isDark ? '#6e7681' : '#94a3b8',
                textAlign: 'right',
                userSelect: 'none',
                fontSize: '12px',
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
        </Link>
      )}
    </div>
  );
}
