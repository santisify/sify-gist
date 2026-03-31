import { NextRequest, NextResponse } from 'next/server';
import { getGistById, getGistTopics } from '@/lib/gists';
import Prism from 'prismjs';
import 'prismjs/components/index';

// 语言映射表
const languageMap: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'sh': 'bash',
  'shell': 'bash',
  'yml': 'yaml',
  'md': 'markdown',
  'htm': 'html',
  'vue': 'markup',
  'svelte': 'markup',
};

// 生成可嵌入的 JavaScript 代码
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gist = await getGistById(id);

    if (!gist) {
      return new NextResponse('Gist not found', { status: 404 });
    }

    // 只允许公开和未列出的 Gist 被嵌入
    if (gist.visibility === 'private') {
      return new NextResponse('This gist is private', { status: 403 });
    }

    const topics = await getGistTopics(id);
    const origin = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${origin}`;

    // 生成多文件标签页（如果有多个文件）
    const hasMultipleFiles = gist.files.length > 1;
    
    // 生成标签页导航
    const tabsHtml = hasMultipleFiles ? `
      <div class="sify-gist-tabs">
        ${gist.files.map((file, index) => `
          <button class="sify-gist-tab ${index === 0 ? 'active' : ''}" data-index="${index}">
            <svg class="sify-gist-tab-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            ${escapeHtml(file.filename)}
          </button>
        `).join('')}
      </div>
    ` : '';

    // 生成文件内容（使用语法高亮）
    const filesHtml = gist.files.map((file, index) => `
      <div class="sify-gist-file ${hasMultipleFiles ? 'sify-gist-file-tabbed' : ''}" data-index="${index}" style="${hasMultipleFiles && index > 0 ? 'display: none;' : ''}">
        <div class="sify-gist-file-header">
          <span class="sify-gist-filename">${escapeHtml(file.filename)}</span>
          <a class="sify-gist-raw-link" href="${baseUrl}/api/gists/${id}/raw/${encodeURIComponent(file.filename)}" target="_blank">view raw</a>
        </div>
        <div class="sify-gist-code">${generateCodeHtml(file.content, file.language)}</div>
      </div>
    `).join('');

    const topicsHtml = topics.length > 0 
      ? `<div class="sify-gist-topics">${topics.map(t => `<span class="sify-gist-topic">${escapeHtml(t)}</span>`).join('')}</div>` 
      : '';

    const descriptionHtml = gist.description 
      ? `<div class="sify-gist-description">${escapeHtml(gist.description)}</div>` 
      : '';

    // 获取主题参数
    const url = new URL(request.url);
    const themeParam = url.searchParams.get('theme');

    // 生成 JavaScript 代码
    const jsCode = `
(function() {
  // 获取脚本 URL 中的主题参数
  var currentScript = document.currentScript;
  var scriptSrc = currentScript ? currentScript.src : '';
  var themeMatch = scriptSrc && scriptSrc.match(/[?&]theme=(light|dark)/);
  var forcedTheme = themeMatch ? themeMatch[1] : null;
  
  var container = document.currentScript.parentElement;
  var gistContainer = document.createElement('div');
  gistContainer.className = 'sify-gist-container' + (forcedTheme ? ' sify-gist-theme-' + forcedTheme : '');
  gistContainer.innerHTML = \`
    <style>
      /* Light theme (default) */
      .sify-gist-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #24292f;
        background-color: #ffffff;
        border: 1px solid #d0d7de;
        border-radius: 6px;
        margin: 16px 0;
        overflow: hidden;
      }
      .sify-gist-header {
        padding: 12px 16px;
        background-color: #f6f8fa;
        border-bottom: 1px solid #d0d7de;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }
      .sify-gist-title {
        font-weight: 600;
        color: #0969da;
        text-decoration: none;
        font-size: 15px;
      }
      .sify-gist-title:hover {
        text-decoration: underline;
      }
      .sify-gist-meta {
        font-size: 12px;
        color: #57606a;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .sify-gist-user {
        color: #57606a;
        text-decoration: none;
      }
      .sify-gist-user:hover {
        color: #0969da;
      }
      .sify-gist-description {
        padding: 12px 16px;
        color: #57606a;
        font-size: 13px;
        border-bottom: 1px solid #d0d7de;
      }
      .sify-gist-topics {
        padding: 8px 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        background-color: #f6f8fa;
        border-bottom: 1px solid #d0d7de;
      }
      .sify-gist-topic {
        display: inline-block;
        padding: 2px 8px;
        font-size: 12px;
        color: #0969da;
        background-color: #ddf4ff;
        border-radius: 12px;
        text-decoration: none;
      }
      .sify-gist-tabs {
        display: flex;
        overflow-x: auto;
        background-color: #f6f8fa;
        border-bottom: 1px solid #d0d7de;
        gap: 0;
      }
      .sify-gist-tab {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        font-size: 13px;
        font-weight: 500;
        color: #57606a;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease;
      }
      .sify-gist-tab:hover {
        color: #24292f;
        background-color: #f3f4f6;
      }
      .sify-gist-tab.active {
        color: #24292f;
        border-bottom-color: #0969da;
      }
      .sify-gist-tab-icon {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }
      .sify-gist-file {
        border-bottom: 1px solid #d0d7de;
      }
      .sify-gist-file-tabbed .sify-gist-file-header {
        display: none;
      }
      .sify-gist-file:last-child {
        border-bottom: none;
      }
      .sify-gist-file-header {
        padding: 8px 16px;
        background-color: #f6f8fa;
        border-bottom: 1px solid #d0d7de;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .sify-gist-filename {
        font-weight: 600;
        color: #24292f;
      }
      .sify-gist-raw-link {
        font-size: 12px;
        color: #57606a;
        text-decoration: none;
      }
      .sify-gist-raw-link:hover {
        color: #0969da;
      }
      .sify-gist-code {
        margin: 0;
        padding: 0;
        overflow-x: auto;
        background-color: #ffffff;
      }
      .sify-gist-code-table {
        width: 100%;
        border-collapse: collapse;
        font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
        font-size: 13px;
        line-height: 1.6;
        margin: 0;
      }
      .sify-gist-line {
        height: 20px;
      }
      .sify-gist-line-num {
        padding: 0 12px;
        text-align: right;
        color: #6e7681;
        user-select: none;
        background-color: #f6f8fa;
        border-right: 1px solid #d0d7de;
        vertical-align: top;
      }
      .sify-gist-line-code {
        padding: 0 16px;
        white-space: pre;
        vertical-align: top;
      }
      /* Prism.js 主题 - 浅色 */
      .sify-gist-code .token.comment,
      .sify-gist-code .token.prolog,
      .sify-gist-code .token.doctype,
      .sify-gist-code .token.cdata { color: #6a737d; }
      .sify-gist-code .token.punctuation { color: #24292f; }
      .sify-gist-code .token.property,
      .sify-gist-code .token.tag,
      .sify-gist-code .token.boolean,
      .sify-gist-code .token.number,
      .sify-gist-code .token.constant,
      .sify-gist-code .token.symbol,
      .sify-gist-code .token.deleted { color: #005cc5; }
      .sify-gist-code .token.selector,
      .sify-gist-code .token.attr-name,
      .sify-gist-code .token.string,
      .sify-gist-code .token.char,
      .sify-gist-code .token.builtin,
      .sify-gist-code .token.inserted { color: #22863a; }
      .sify-gist-code .token.operator,
      .sify-gist-code .token.entity,
      .sify-gist-code .token.url,
      .sify-gist-code .language-css .token.string,
      .sify-gist-code .style .token.string { color: #d73a49; }
      .sify-gist-code .token.atrule,
      .sify-gist-code .token.attr-value,
      .sify-gist-code .token.keyword { color: #d73a49; }
      .sify-gist-code .token.function,
      .sify-gist-code .token.class-name { color: #6f42c1; }
      .sify-gist-code .token.regex,
      .sify-gist-code .token.important,
      .sify-gist-code .token.variable { color: #e36209; }
      .sify-gist-footer {
        padding: 8px 16px;
        background-color: #f6f8fa;
        border-top: 1px solid #d0d7de;
        font-size: 12px;
        color: #57606a;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .sify-gist-footer a {
        color: #57606a;
        text-decoration: none;
      }
      .sify-gist-footer a:hover {
        color: #0969da;
      }

      /* Dark theme - 自动检测系统偏好 */
      @media (prefers-color-scheme: dark) {
        .sify-gist-container:not(.sify-gist-theme-light) {
          color: #c9d1d9;
          background-color: #0d1117;
          border-color: #30363d;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-header {
          background-color: #161b22;
          border-bottom-color: #30363d;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-title {
          color: #58a6ff;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-meta {
          color: #8b949e;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-user {
          color: #8b949e;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-user:hover {
          color: #58a6ff;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-description {
          color: #8b949e;
          border-bottom-color: #30363d;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-topics {
          background-color: #161b22;
          border-bottom-color: #30363d;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-topic {
          color: #58a6ff;
          background-color: #1f3a5f;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-tabs {
          background-color: #161b22;
          border-bottom-color: #30363d;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-tab {
          color: #8b949e;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-tab:hover {
          color: #c9d1d9;
          background-color: #21262d;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-tab.active {
          color: #c9d1d9;
          border-bottom-color: #58a6ff;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-file {
          border-bottom-color: #30363d;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-file-header {
          background-color: #161b22;
          border-bottom-color: #30363d;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-filename {
          color: #c9d1d9;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-raw-link {
          color: #8b949e;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-raw-link:hover {
          color: #58a6ff;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-code {
          background-color: #0d1117;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-line-num {
          color: #484f58;
          background-color: #161b22;
          border-right-color: #30363d;
        }
        /* Prism.js 主题 - 暗色 */
        .sify-gist-container:not(.sify-gist-theme-light) .token.comment,
        .sify-gist-container:not(.sify-gist-theme-light) .token.prolog,
        .sify-gist-container:not(.sify-gist-theme-light) .token.doctype,
        .sify-gist-container:not(.sify-gist-theme-light) .token.cdata { color: #8b949e; }
        .sify-gist-container:not(.sify-gist-theme-light) .token.punctuation { color: #c9d1d9; }
        .sify-gist-container:not(.sify-gist-theme-light) .token.property,
        .sify-gist-container:not(.sify-gist-theme-light) .token.tag,
        .sify-gist-container:not(.sify-gist-theme-light) .token.boolean,
        .sify-gist-container:not(.sify-gist-theme-light) .token.number,
        .sify-gist-container:not(.sify-gist-theme-light) .token.constant,
        .sify-gist-container:not(.sify-gist-theme-light) .token.symbol,
        .sify-gist-container:not(.sify-gist-theme-light) .token.deleted { color: #79c0ff; }
        .sify-gist-container:not(.sify-gist-theme-light) .token.selector,
        .sify-gist-container:not(.sify-gist-theme-light) .token.attr-name,
        .sify-gist-container:not(.sify-gist-theme-light) .token.string,
        .sify-gist-container:not(.sify-gist-theme-light) .token.char,
        .sify-gist-container:not(.sify-gist-theme-light) .token.builtin,
        .sify-gist-container:not(.sify-gist-theme-light) .token.inserted { color: #7ee787; }
        .sify-gist-container:not(.sify-gist-theme-light) .token.operator,
        .sify-gist-container:not(.sify-gist-theme-light) .token.entity,
        .sify-gist-container:not(.sify-gist-theme-light) .token.url,
        .sify-gist-container:not(.sify-gist-theme-light) .language-css .token.string,
        .sify-gist-container:not(.sify-gist-theme-light) .style .token.string { color: #ff7b72; }
        .sify-gist-container:not(.sify-gist-theme-light) .token.atrule,
        .sify-gist-container:not(.sify-gist-theme-light) .token.attr-value,
        .sify-gist-container:not(.sify-gist-theme-light) .token.keyword { color: #ff7b72; }
        .sify-gist-container:not(.sify-gist-theme-light) .token.function,
        .sify-gist-container:not(.sify-gist-theme-light) .token.class-name { color: #d2a8ff; }
        .sify-gist-container:not(.sify-gist-theme-light) .token.regex,
        .sify-gist-container:not(.sify-gist-theme-light) .token.important,
        .sify-gist-container:not(.sify-gist-theme-light) .token.variable { color: #ffa657; }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-footer {
          background-color: #161b22;
          border-top-color: #30363d;
          color: #8b949e;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-footer a {
          color: #8b949e;
        }
        .sify-gist-container:not(.sify-gist-theme-light) .sify-gist-footer a:hover {
          color: #58a6ff;
        }
      }

      /* 强制暗色主题 */
      .sify-gist-theme-dark {
        color: #c9d1d9 !important;
        background-color: #0d1117 !important;
        border-color: #30363d !important;
      }
      .sify-gist-theme-dark .sify-gist-header {
        background-color: #161b22 !important;
        border-bottom-color: #30363d !important;
      }
      .sify-gist-theme-dark .sify-gist-title {
        color: #58a6ff !important;
      }
      .sify-gist-theme-dark .sify-gist-meta {
        color: #8b949e !important;
      }
      .sify-gist-theme-dark .sify-gist-user {
        color: #8b949e !important;
      }
      .sify-gist-theme-dark .sify-gist-user:hover {
        color: #58a6ff !important;
      }
      .sify-gist-theme-dark .sify-gist-description {
        color: #8b949e !important;
        border-bottom-color: #30363d !important;
      }
      .sify-gist-theme-dark .sify-gist-topics {
        background-color: #161b22 !important;
        border-bottom-color: #30363d !important;
      }
      .sify-gist-theme-dark .sify-gist-topic {
        color: #58a6ff !important;
        background-color: #1f3a5f !important;
      }
      .sify-gist-theme-dark .sify-gist-tabs {
        background-color: #161b22 !important;
        border-bottom-color: #30363d !important;
      }
      .sify-gist-theme-dark .sify-gist-tab {
        color: #8b949e !important;
      }
      .sify-gist-theme-dark .sify-gist-tab:hover {
        color: #c9d1d9 !important;
        background-color: #21262d !important;
      }
      .sify-gist-theme-dark .sify-gist-tab.active {
        color: #c9d1d9 !important;
        border-bottom-color: #58a6ff !important;
      }
      .sify-gist-theme-dark .sify-gist-file {
        border-bottom-color: #30363d !important;
      }
      .sify-gist-theme-dark .sify-gist-file-header {
        background-color: #161b22 !important;
        border-bottom-color: #30363d !important;
      }
      .sify-gist-theme-dark .sify-gist-filename {
        color: #c9d1d9 !important;
      }
      .sify-gist-theme-dark .sify-gist-raw-link {
        color: #8b949e !important;
      }
      .sify-gist-theme-dark .sify-gist-raw-link:hover {
        color: #58a6ff !important;
      }
      .sify-gist-theme-dark .sify-gist-code {
        background-color: #0d1117 !important;
      }
      .sify-gist-theme-dark .sify-gist-line-num {
        color: #484f58 !important;
        background-color: #161b22 !important;
        border-right-color: #30363d !important;
      }
      /* Prism.js 主题 - 强制暗色 */
      .sify-gist-theme-dark .token.comment,
      .sify-gist-theme-dark .token.prolog,
      .sify-gist-theme-dark .token.doctype,
      .sify-gist-theme-dark .token.cdata { color: #8b949e !important; }
      .sify-gist-theme-dark .token.punctuation { color: #c9d1d9 !important; }
      .sify-gist-theme-dark .token.property,
      .sify-gist-theme-dark .token.tag,
      .sify-gist-theme-dark .token.boolean,
      .sify-gist-theme-dark .token.number,
      .sify-gist-theme-dark .token.constant,
      .sify-gist-theme-dark .token.symbol,
      .sify-gist-theme-dark .token.deleted { color: #79c0ff !important; }
      .sify-gist-theme-dark .token.selector,
      .sify-gist-theme-dark .token.attr-name,
      .sify-gist-theme-dark .token.string,
      .sify-gist-theme-dark .token.char,
      .sify-gist-theme-dark .token.builtin,
      .sify-gist-theme-dark .token.inserted { color: #7ee787 !important; }
      .sify-gist-theme-dark .token.operator,
      .sify-gist-theme-dark .token.entity,
      .sify-gist-theme-dark .token.url,
      .sify-gist-theme-dark .language-css .token.string,
      .sify-gist-theme-dark .style .token.string { color: #ff7b72 !important; }
      .sify-gist-theme-dark .token.atrule,
      .sify-gist-theme-dark .token.attr-value,
      .sify-gist-theme-dark .token.keyword { color: #ff7b72 !important; }
      .sify-gist-theme-dark .token.function,
      .sify-gist-theme-dark .token.class-name { color: #d2a8ff !important; }
      .sify-gist-theme-dark .token.regex,
      .sify-gist-theme-dark .token.important,
      .sify-gist-theme-dark .token.variable { color: #ffa657 !important; }
      .sify-gist-theme-dark .sify-gist-footer {
        background-color: #161b22 !important;
        border-top-color: #30363d !important;
        color: #8b949e !important;
      }
      .sify-gist-theme-dark .sify-gist-footer a {
        color: #8b949e !important;
      }
      .sify-gist-theme-dark .sify-gist-footer a:hover {
        color: #58a6ff !important;
      }

      /* 强制浅色主题 */
      .sify-gist-theme-light {
        color: #24292f !important;
        background-color: #ffffff !important;
        border-color: #d0d7de !important;
      }
      .sify-gist-theme-light .sify-gist-header {
        background-color: #f6f8fa !important;
        border-bottom-color: #d0d7de !important;
      }
      .sify-gist-theme-light .sify-gist-title {
        color: #0969da !important;
      }
      .sify-gist-theme-light .sify-gist-meta {
        color: #57606a !important;
      }
      .sify-gist-theme-light .sify-gist-user {
        color: #57606a !important;
      }
      .sify-gist-theme-light .sify-gist-user:hover {
        color: #0969da !important;
      }
      .sify-gist-theme-light .sify-gist-description {
        color: #57606a !important;
        border-bottom-color: #d0d7de !important;
      }
      .sify-gist-theme-light .sify-gist-topics {
        background-color: #f6f8fa !important;
        border-bottom-color: #d0d7de !important;
      }
      .sify-gist-theme-light .sify-gist-topic {
        color: #0969da !important;
        background-color: #ddf4ff !important;
      }
      .sify-gist-theme-light .sify-gist-tabs {
        background-color: #f6f8fa !important;
        border-bottom-color: #d0d7de !important;
      }
      .sify-gist-theme-light .sify-gist-tab {
        color: #57606a !important;
      }
      .sify-gist-theme-light .sify-gist-tab:hover {
        color: #24292f !important;
        background-color: #f3f4f6 !important;
      }
      .sify-gist-theme-light .sify-gist-tab.active {
        color: #24292f !important;
        border-bottom-color: #0969da !important;
      }
      .sify-gist-theme-light .sify-gist-file {
        border-bottom-color: #d0d7de !important;
      }
      .sify-gist-theme-light .sify-gist-file-header {
        background-color: #f6f8fa !important;
        border-bottom-color: #d0d7de !important;
      }
      .sify-gist-theme-light .sify-gist-filename {
        color: #24292f !important;
      }
      .sify-gist-theme-light .sify-gist-raw-link {
        color: #57606a !important;
      }
      .sify-gist-theme-light .sify-gist-raw-link:hover {
        color: #0969da !important;
      }
      .sify-gist-theme-light .sify-gist-code {
        background-color: #ffffff !important;
      }
      .sify-gist-theme-light .sify-gist-line-num {
        color: #6e7681 !important;
        background-color: #f6f8fa !important;
        border-right-color: #d0d7de !important;
      }
      /* Prism.js 主题 - 强制浅色 */
      .sify-gist-theme-light .token.comment,
      .sify-gist-theme-light .token.prolog,
      .sify-gist-theme-light .token.doctype,
      .sify-gist-theme-light .token.cdata { color: #6a737d !important; }
      .sify-gist-theme-light .token.punctuation { color: #24292f !important; }
      .sify-gist-theme-light .token.property,
      .sify-gist-theme-light .token.tag,
      .sify-gist-theme-light .token.boolean,
      .sify-gist-theme-light .token.number,
      .sify-gist-theme-light .token.constant,
      .sify-gist-theme-light .token.symbol,
      .sify-gist-theme-light .token.deleted { color: #005cc5 !important; }
      .sify-gist-theme-light .token.selector,
      .sify-gist-theme-light .token.attr-name,
      .sify-gist-theme-light .token.string,
      .sify-gist-theme-light .token.char,
      .sify-gist-theme-light .token.builtin,
      .sify-gist-theme-light .token.inserted { color: #22863a !important; }
      .sify-gist-theme-light .token.operator,
      .sify-gist-theme-light .token.entity,
      .sify-gist-theme-light .token.url,
      .sify-gist-theme-light .language-css .token.string,
      .sify-gist-theme-light .style .token.string { color: #d73a49 !important; }
      .sify-gist-theme-light .token.atrule,
      .sify-gist-theme-light .token.attr-value,
      .sify-gist-theme-light .token.keyword { color: #d73a49 !important; }
      .sify-gist-theme-light .token.function,
      .sify-gist-theme-light .token.class-name { color: #6f42c1 !important; }
      .sify-gist-theme-light .token.regex,
      .sify-gist-theme-light .token.important,
      .sify-gist-theme-light .token.variable { color: #e36209 !important; }
      .sify-gist-theme-light .sify-gist-footer {
        background-color: #f6f8fa !important;
        border-top-color: #d0d7de !important;
        color: #57606a !important;
      }
      .sify-gist-theme-light .sify-gist-footer a {
        color: #57606a !important;
      }
      .sify-gist-theme-light .sify-gist-footer a:hover {
        color: #0969da !important;
      }
    </style>
    <div class="sify-gist-header">
      <a class="sify-gist-title" href="${baseUrl}/gists/${id}" target="_blank">${escapeHtml(gist.title || 'Untitled')}</a>
      <div class="sify-gist-meta">
        <a class="sify-gist-user" href="${baseUrl}/profile" target="_blank">${escapeHtml(gist.user?.name || 'Anonymous')}</a>
        <span>·</span>
        <span>${formatDate(gist.created_at)}</span>
      </div>
    </div>
    ${descriptionHtml}
    ${topicsHtml}
    ${tabsHtml}
    <div class="sify-gist-files">${filesHtml}</div>
    <div class="sify-gist-footer">
      <span>via <a href="${baseUrl}" target="_blank">Sify Gist</a></span>
      <a href="${baseUrl}/gists/${id}" target="_blank">View on Sify Gist</a>
    </div>
  \`;
  
  // 查找目标容器
  var targetId = 'sify-gist-${id}';
  var target = document.getElementById(targetId);
  if (target) {
    target.appendChild(gistContainer);
  } else {
    // 如果没有指定容器，插入到 script 标签之后
    document.currentScript.insertAdjacentElement('afterend', gistContainer);
  }
  
  // 标签页切换逻辑
  var tabs = gistContainer.querySelectorAll('.sify-gist-tab');
  var files = gistContainer.querySelectorAll('.sify-gist-file');
  
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var index = this.getAttribute('data-index');
      
      // 更新标签激活状态
      tabs.forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      
      // 切换文件显示
      files.forEach(function(file) {
        if (file.getAttribute('data-index') === index) {
          file.style.display = 'block';
        } else {
          file.style.display = 'none';
        }
      });
    });
  });
})();
`.trim();

    return new NextResponse(jsCode, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // 缓存 5 分钟
      },
    });
  } catch (error) {
    console.error('生成 Embed JS 失败:', error);
    return new NextResponse('Error generating embed script', { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 使用 Prism.js 高亮代码
function highlightCode(code: string, language: string): string {
  // 获取实际语言
  const actualLang = languageMap[language.toLowerCase()] || language.toLowerCase();
  
  try {
    // 检查 Prism 是否支持该语言
    if (Prism.languages[actualLang]) {
      return Prism.highlight(code, Prism.languages[actualLang], actualLang);
    }
    // 回退到自动检测
    return Prism.highlight(code, Prism.languages.javascript, 'javascript');
  } catch {
    // 如果高亮失败，返回转义后的纯文本
    return escapeHtml(code);
  }
}

// 生成带行号的代码 HTML
function generateCodeHtml(code: string, language: string): string {
  const highlighted = highlightCode(code, language);
  const lines = highlighted.split('\n');
  const lineCount = lines.length;
  const lineNumberWidth = String(lineCount).length * 0.6 + 1;
  
  const linesHtml = lines.map((line, index) => {
    const lineNum = index + 1;
    return `<tr class="sify-gist-line">
      <td class="sify-gist-line-num" style="width: ${lineNumberWidth}em;">${lineNum}</td>
      <td class="sify-gist-line-code">${line || ' '}</td>
    </tr>`;
  }).join('');
  
  return `<table class="sify-gist-code-table">${linesHtml}</table>`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else if (days > 0) {
    return `${days} days ago`;
  } else if (hours > 0) {
    return `${hours} hours ago`;
  } else if (minutes > 0) {
    return `${minutes} minutes ago`;
  } else {
    return 'just now';
  }
}
