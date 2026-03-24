'use client';

import { useState } from 'react';
import Link from 'next/link';
import CodeBlock from './CodeBlock';
import { getPrismLanguage } from '@/lib/language-support';

interface File {
  filename: string;
  content: string;
  language: string;
}

interface Gist {
  id: string;
  title?: string;
  description?: string;
  topics?: string[];
  created_at: string;
  updated_at: string;
  files: File[];
  forked_from?: string;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

function getFileSize(content: string): string {
  const bytes = new Blob([content]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GistDisplay({ gist }: { gist: Gist }) {
  const [copied, setCopied] = useState<{[key: string]: boolean}>({});
  const [activeFile, setActiveFile] = useState(0);

  const handleCopy = (filename: string) => {
    navigator.clipboard.writeText(gist.files.find(f => f.filename === filename)?.content || '');
    setCopied(prev => ({ ...prev, [filename]: true }));
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [filename]: false }));
    }, 2000);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/gists/${gist.id}/export`);
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${gist.title || 'gist'}-${gist.id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="card">
      {/* 标签 */}
      {gist.topics && gist.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          {gist.topics.map(topic => (
            <Link
              key={topic}
              href={`/discover?topic=${encodeURIComponent(topic)}`}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              {topic}
            </Link>
          ))}
        </div>
      )}

      {/* Fork 来源提示 */}
      {gist.forked_from && (
        <div className="px-4 py-2 border-b text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Forked from <Link href={`/gists/${gist.forked_from}`} className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>another gist</Link>
        </div>
      )}

      {/* 多文件时显示标签页 */}
      {gist.files.length > 1 && (
        <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-code)' }}>
          {gist.files.map((file, index) => (
            <button
              key={index}
              onClick={() => setActiveFile(index)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
              style={{
                color: activeFile === index ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
                borderColor: activeFile === index ? 'var(--color-primary)' : 'transparent'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {file.filename}
            </button>
          ))}
        </div>
      )}

      {/* 当前文件内容 */}
      {gist.files.length > 1 ? (
        gist.files[activeFile] && (
          <>
            <div className="file-header">
              <div className="file-name">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                {gist.files[activeFile].filename}
              </div>
              <div className="flex items-center gap-3">
                <span className="file-meta">
                  {getFileSize(gist.files[activeFile].content)} · {gist.files[activeFile].language}
                </span>
                <a 
                  href={`/api/gists/${gist.id}/raw/${encodeURIComponent(gist.files[activeFile].filename)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                >
                  Raw
                </a>
                <button 
                  onClick={() => handleCopy(gist.files[activeFile].filename)}
                  className="btn btn-sm"
                >
                  {copied[gist.files[activeFile].filename] ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="code-block" style={{ borderTop: 'none' }}>
              <CodeBlock code={gist.files[activeFile].content} language={getPrismLanguage(gist.files[activeFile].language)} />
            </div>
          </>
        )
      ) : (
        // 单文件
        gist.files.map((file, index) => (
          <div key={index}>
            <div className="file-header">
              <div className="file-name">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                {file.filename}
              </div>
              <div className="flex items-center gap-3">
                <span className="file-meta">
                  {getFileSize(file.content)} · {file.language}
                </span>
                <a 
                  href={`/api/gists/${gist.id}/raw/${encodeURIComponent(file.filename)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                >
                  Raw
                </a>
                <button 
                  onClick={() => handleCopy(file.filename)}
                  className="btn btn-sm"
                >
                  {copied[file.filename] ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleExport} className="btn btn-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
            <div className="code-block" style={{ borderTop: 'none' }}>
              <CodeBlock code={file.content} language={getPrismLanguage(file.language)} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
