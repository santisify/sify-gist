import { NextRequest, NextResponse } from 'next/server';
import { getGistById, getGistTopics } from '@/lib/gists';

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

    // 生成 HTML 内容
    const filesHtml = gist.files.map(file => `
      <div class="sify-gist-file">
        <div class="sify-gist-file-header">
          <span class="sify-gist-filename">${escapeHtml(file.filename)}</span>
          <a class="sify-gist-raw-link" href="${baseUrl}/api/gists/${id}/raw/${encodeURIComponent(file.filename)}" target="_blank">view raw</a>
        </div>
        <pre class="sify-gist-code"><code class="language-${file.language}">${escapeHtml(file.content)}</code></pre>
      </div>
    `).join('');

    const topicsHtml = topics.length > 0 
      ? `<div class="sify-gist-topics">${topics.map(t => `<span class="sify-gist-topic">${escapeHtml(t)}</span>`).join('')}</div>` 
      : '';

    const descriptionHtml = gist.description 
      ? `<div class="sify-gist-description">${escapeHtml(gist.description)}</div>` 
      : '';

    // 生成 JavaScript 代码
    const jsCode = `
(function() {
  var container = document.currentScript.parentElement;
  var gistContainer = document.createElement('div');
  gistContainer.className = 'sify-gist-container';
  gistContainer.innerHTML = \`
    <style>
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
      .sify-gist-file {
        border-bottom: 1px solid #d0d7de;
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
        padding: 16px;
        overflow-x: auto;
        background-color: #ffffff;
      }
      .sify-gist-code code {
        font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
        font-size: 13px;
        line-height: 1.6;
        white-space: pre;
      }
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
