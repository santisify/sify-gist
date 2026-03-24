'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from '@/lib/theme-context';

interface CodeBlockProps {
  code: string;
  language: string;
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showPreview, setShowPreview] = useState(true);
  
  const style = isDark ? atomDark : oneLight;
  
  // 检测是否是 Markdown 或 CSV 文件
  const isMarkdown = language === 'markdown' || language === 'md';
  const isCSV = language === 'csv' || language === 'text';
  
  // 如果是 CSV 且内容看起来像 CSV（有逗号分隔）
  const isActuallyCSV = isCSV && code.includes(',') && code.split('\n').some(line => line.split(',').length > 1);

  if (isMarkdown && showPreview) {
    return (
      <div className="relative">
        <div className="absolute right-2 top-2 z-10">
          <button
            onClick={() => setShowPreview(false)}
            className="btn btn-sm text-xs"
            title="View source"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>
        <MarkdownPreview content={code} isDark={isDark} />
      </div>
    );
  }

  if (isActuallyCSV && showPreview) {
    return (
      <div className="relative">
        <div className="absolute right-2 top-2 z-10">
          <button
            onClick={() => setShowPreview(false)}
            className="btn btn-sm text-xs"
            title="View source"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>
        <CSVPreview content={code} isDark={isDark} />
      </div>
    );
  }

  // 显示代码视图时添加预览按钮（对于 Markdown 和 CSV）
  const showPreviewButton = (isMarkdown || isActuallyCSV);
  
  return (
    <div className="relative">
      {showPreviewButton && (
        <div className="absolute right-2 top-2 z-10">
          <button
            onClick={() => setShowPreview(true)}
            className="btn btn-sm text-xs"
            title="View preview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      )}
      <SyntaxHighlighter 
        language={isMarkdown ? 'markdown' : (isActuallyCSV ? 'csv' : language)} 
        style={style}
        showLineNumbers
        lineNumberStyle={{
          minWidth: '3em',
          paddingRight: '1em',
          textAlign: 'right',
          color: isDark ? '#6e7681' : '#9e9e9e',
          userSelect: 'none',
        }}
        customStyle={{ 
          padding: '16px',
          margin: 0,
          fontSize: '13px',
          lineHeight: '1.6',
          backgroundColor: isDark ? '#0d1117' : '#ffffff',
        }}
        codeTagProps={{
          style: {
            fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
            fontSize: '13px',
            lineHeight: '1.6'
          }
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Markdown 预览组件
function MarkdownPreview({ content, isDark }: { content: string; isDark: boolean }) {
  // 简单的 Markdown 渲染器
  const renderMarkdown = (text: string) => {
    let html = text;
    
    // 转义 HTML 特殊字符
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // 代码块
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="md-code-block"><code class="language-${lang}">${code.trim()}</code></pre>`;
    });
    
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
    
    // 标题
    html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // 粗体和斜体
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // 删除线
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // 图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-image" />');
    
    // 无序列表
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // 引用
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // 水平线
    html = html.replace(/^---$/gm, '<hr />');
    html = html.replace(/^\*\*\*$/gm, '<hr />');
    
    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr \/>)/g, '$1');
    html = html.replace(/(<hr \/>)<\/p>/g, '$1');
    
    // 换行
    html = html.replace(/\n/g, '<br />');
    
    return html;
  };

  return (
    <div 
      className="markdown-preview p-6"
      style={{
        backgroundColor: isDark ? '#0d1117' : '#ffffff',
        color: isDark ? '#c9d1d9' : '#24292f',
      }}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

// CSV 预览组件
function CSVPreview({ content, isDark }: { content: string; isDark: boolean }) {
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    return lines.map(line => {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (inQuotes) {
          if (char === '"' && line[i + 1] === '"') {
            current += '"';
            i++;
          } else if (char === '"') {
            inQuotes = false;
          } else {
            current += char;
          }
        } else {
          if (char === '"') {
            inQuotes = true;
          } else if (char === ',') {
            cells.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
      }
      cells.push(current.trim());
      
      return cells;
    });
  };

  const rows = parseCSV(content);
  const header = rows[0] || [];
  const dataRows = rows.slice(1);

  return (
    <div className="csv-preview overflow-x-auto p-4" style={{ backgroundColor: isDark ? '#0d1117' : '#ffffff' }}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {header.map((cell, index) => (
              <th
                key={index}
                className="px-4 py-2 text-left font-semibold border-b"
                style={{
                  borderColor: isDark ? '#30363d' : '#d0d7de',
                  backgroundColor: isDark ? '#161b22' : '#f6f8fa',
                  color: isDark ? '#c9d1d9' : '#24292f',
                }}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b" style={{ borderColor: isDark ? '#30363d' : '#d0d7de' }}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-2"
                  style={{
                    color: isDark ? '#c9d1d9' : '#24292f',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {dataRows.length === 0 && (
        <p className="text-center py-4" style={{ color: isDark ? '#8b949e' : '#57606a' }}>
          No data rows
        </p>
      )}
    </div>
  );
}