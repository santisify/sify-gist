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

  const handleCopy = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
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

  const handleShare = async () => {
    const url = `${window.location.origin}/gists/${gist.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: gist.title || '分享一个 Gist',
          text: gist.description || '查看这个代码片段',
          url: url
        });
      } catch (error) {
        console.log('分享失败:', error);
      }
    } else {
      // 如果不支持 Web Share API，则复制链接
      handleCopyUrl();
    }
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
      
      // 创建一个临时链接来下载文件
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
    <div className="w-full overflow-x-auto">
      <div className="mb-4 flex flex-wrap gap-2">
        <button 
          onClick={handleCopyUrl}
          className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition duration-200 border border-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copiedUrl ? '已复制!' : '复制链接'}
        </button>
        
        <button 
          onClick={handleShare}
          className="flex items-center text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md transition duration-200 border border-blue-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          分享
        </button>
        
        <button 
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center text-sm bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-md transition duration-200 border border-green-200 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? '导出中...' : '导出 ZIP'}
        </button>
      </div>
      
      <div className="border border-gray-200 rounded-md overflow-hidden">
        {gist.files.map((file, fileIndex) => (
          <div key={fileIndex} className="mb-6 last:mb-0">
            <div className="flex justify-between items-center bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 font-mono">{file.filename}</span>
              </div>
              <div className="flex items-center space-x-2">
                <a 
                  href={`/api/gists/${gist.id}/raw/${encodeURIComponent(file.filename)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
                >
                  原始
                </a>
                <CopyToClipboard text={file.content} onCopy={() => handleCopy(file.filename, file.content)}>
                  <button className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded">
                    {copied[file.filename] ? '已复制!' : '复制'}
                  </button>
                </CopyToClipboard>
              </div>
            </div>
            <div className="relative">
              <CodeBlock code={file.content} language={getPrismLanguage(file.language)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}