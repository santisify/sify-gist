// components/GistDisplay.tsx
'use client';

import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
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
  created_at: string;
  updated_at: string;
  files: File[];
}

export default function GistDisplay({ gist }: { gist: Gist }) {
  const [copied, setCopied] = useState<{[key: string]: boolean}>({});
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleCopy = (filename: string) => {
    setCopied(prev => ({ ...prev, [filename]: true }));
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [filename]: false }));
    }, 2000);
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/gists/${gist.id}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleExport = async () => {
    setExporting(true);
    
    try {
      const response = await fetch(`/api/gists/${gist.id}/export`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/zip',
        },
      });
      
      if (!response.ok) {
        throw new Error('导出失败');
      }
      
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
      console.error('导出错误:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full">
      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-2 p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <button 
          onClick={handleCopyUrl}
          className="btn-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copiedUrl ? '已复制!' : '复制链接'}
        </button>
        
        <button 
          onClick={handleExport}
          disabled={exporting}
          className="btn-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? '导出中...' : '下载 ZIP'}
        </button>
      </div>
      
      {/* 文件列表 */}
      {gist.files.map((file, fileIndex) => (
        <div key={fileIndex} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
          {/* 文件头部 */}
          <div className="file-header">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-mono" style={{ color: 'var(--color-text-main)' }}>{file.filename}</span>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={`/api/gists/${gist.id}/raw/${encodeURIComponent(file.filename)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-sm"
              >
                Raw
              </a>
              <CopyToClipboard text={file.content} onCopy={() => handleCopy(file.filename)}>
                <button className="btn-sm">
                  {copied[file.filename] ? '已复制!' : '复制'}
                </button>
              </CopyToClipboard>
            </div>
          </div>
          
          {/* 代码块 */}
          <div className="code-container border-0 border-t rounded-none" style={{ borderColor: 'var(--color-border)' }}>
            <CodeBlock code={file.content} language={getPrismLanguage(file.language)} />
          </div>
        </div>
      ))}
    </div>
  );
}
