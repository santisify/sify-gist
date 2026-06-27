import { NextRequest, NextResponse } from 'next/server';
import { getGistById, getGistTopics } from '@/lib/gists';
import Prism from 'prismjs';
import 'prismjs/components/index';

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

function getFileSize(content: string): string {
  const bytes = new TextEncoder().encode(content).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

    if (gist.visibility === 2) {
      return new NextResponse('This gist is private', { status: 403 });
    }

    const topics = await getGistTopics(id);
    const origin = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${origin}`;

    const hasMultipleFiles = gist.files.length > 1;

    const url = new URL(request.url);
    const themeParam = url.searchParams.get('theme');
    const collapsibleParam = url.searchParams.get('collapsible');
    const defaultCollapsedParam = url.searchParams.get('collapsed');
    const isCollapsible = collapsibleParam === 'true';
    const defaultCollapsed = defaultCollapsedParam === 'true';

    const filesData = gist.files.map(file => ({
      filename: file.filename,
      language: file.language || 'text',
      content: file.content,
      size: getFileSize(file.content),
      highlighted: generateCodeHtml(file.content, file.language),
    }));

    const tabsHtml = hasMultipleFiles ? `
      <div class="sg-tabs">
        ${gist.files.map((file, index) => `
          <button class="sg-tab${index === 0 ? ' active' : ''}" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            ${escapeContent(file.filename)}
          </button>
        `).join('')}
      </div>
    ` : '';

    const filesHtml = filesData.map((file, index) => `
      <div class="sg-file${hasMultipleFiles ? ' sg-file-tabbed' : ''}" data-index="${index}" style="${hasMultipleFiles && index > 0 ? 'display:none;' : ''}">
        ${!hasMultipleFiles ? `
        <div class="sg-file-header">
          <span class="sg-filename">${escapeContent(file.filename)}</span>
          <span class="sg-file-meta">${file.size}</span>
          <span class="sg-file-actions">
            <a href="${baseUrl}/api/gists/${id}/raw/${encodeURIComponent(file.filename)}" target="_blank">view raw</a>
            <button class="sg-copy-btn" data-content="${escapeContent(file.content)}">copy</button>
          </span>
        </div>` : ''}
        <div class="sg-code">${file.highlighted}</div>
      </div>
    `).join('');

    const topicsHtml = topics.length > 0
      ? `<div class="sg-topics">${topics.map(t => `<span class="sg-topic">${escapeContent(t)}</span>`).join('')}</div>`
      : '';

    const descriptionHtml = gist.description
      ? `<div class="sg-description">${escapeContent(gist.description)}</div>`
      : '';

    const collapsibleBtnHtml = isCollapsible
      ? `<button class="sg-toggle" onclick="window._sgToggle('${escapeForJsTemplate(id)}')" title="Toggle">
          <svg class="sg-toggle-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>`
      : '';

    const jsCode = `
(function() {
  var currentScript = document.currentScript;
  var scriptSrc = currentScript ? currentScript.src : '';
  var themeMatch = scriptSrc && scriptSrc.match(/[?&]theme=(light|dark)/);
  var forcedTheme = themeMatch ? themeMatch[1] : null;

  var isCollapsible = ${isCollapsible};
  var gistId = ${JSON.stringify(id)};
  var hasStoredState = localStorage.getItem('sg-collapsed-' + gistId) !== null;
  var isCollapsed = isCollapsible && (hasStoredState ? localStorage.getItem('sg-collapsed-' + gistId) === 'true' : ${defaultCollapsed});

  var el = document.createElement('div');
  el.className = 'sg-embed' + (forcedTheme ? ' sg-theme-' + forcedTheme : '') + (isCollapsible ? ' sg-collapsible' : '') + (isCollapsed ? ' sg-collapsed' : '');

  el.innerHTML = \`
<style>
  .sg-embed {
    --sg-bg: #ffffff;
    --sg-bg-secondary: #f6f8fa;
    --sg-border: #d0d7de;
    --sg-text: #24292f;
    --sg-text-secondary: #656d76;
    --sg-text-muted: #8b949e;
    --sg-link: #0969da;
    --sg-code-bg: #ffffff;
    --sg-line-num-bg: #f6f8fa;
    --sg-line-num-border: #d0d7de;
    --sg-line-hover: #f6f8fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--sg-text);
    background: var(--sg-bg);
    border: 1px solid var(--sg-border);
    border-radius: 6px;
    margin: 16px 0;
    overflow: hidden;
  }
  .sg-header {
    padding: 10px 16px;
    background: var(--sg-bg-secondary);
    border-bottom: 1px solid var(--sg-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .sg-title { font-weight: 600; color: var(--sg-link); text-decoration: none; font-size: 14px; }
  .sg-title:hover { text-decoration: underline; }
  .sg-meta { font-size: 12px; color: var(--sg-text-secondary); display: flex; align-items: center; gap: 8px; }
  .sg-user { color: var(--sg-text-secondary); text-decoration: none; }
  .sg-user:hover { color: var(--sg-link); }
  .sg-description { padding: 8px 16px; color: var(--sg-text-secondary); font-size: 13px; border-bottom: 1px solid var(--sg-border); }
  .sg-topics { padding: 8px 16px; display: flex; flex-wrap: wrap; gap: 6px; background: var(--sg-bg-secondary); border-bottom: 1px solid var(--sg-border); }
  .sg-topic { display: inline-block; padding: 2px 8px; font-size: 12px; color: var(--sg-link); background: #ddf4ff; border-radius: 12px; text-decoration: none; }
  .sg-tabs { display: flex; overflow-x: auto; background: var(--sg-bg-secondary); border-bottom: 1px solid var(--sg-border); }
  .sg-tab { display: flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 12px; font-weight: 500; color: var(--sg-text-secondary); background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; }
  .sg-tab:hover { color: var(--sg-text); background: var(--sg-line-hover); }
  .sg-tab.active { color: var(--sg-text); border-bottom-color: var(--sg-link); font-weight: 600; }
  .sg-file { border-bottom: 1px solid var(--sg-border); }
  .sg-file:last-child { border-bottom: none; }
  .sg-file-tabbed .sg-file-header { display: none; }
  .sg-file-header { padding: 8px 16px; background: var(--sg-bg-secondary); border-bottom: 1px solid var(--sg-border); display: flex; align-items: center; gap: 8px; font-size: 12px; }
  .sg-filename { font-weight: 600; color: var(--sg-text); }
  .sg-file-meta { color: var(--sg-text-muted); }
  .sg-file-actions { margin-left: auto; display: flex; gap: 8px; align-items: center; }
  .sg-file-actions a, .sg-file-actions button { color: var(--sg-text-secondary); text-decoration: none; background: none; border: none; cursor: pointer; font-size: 12px; padding: 0; font-family: inherit; }
  .sg-file-actions a:hover, .sg-file-actions button:hover { color: var(--sg-link); }
  .sg-code { margin: 0; padding: 0; overflow-x: auto; background: var(--sg-code-bg); }
  .sg-code table { width: 100%; border-collapse: collapse; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace; font-size: 12px; line-height: 20px; }
  .sg-code tr:hover { background: var(--sg-line-hover); }
  .sg-code td { padding: 0; vertical-align: top; }
  .sg-line-num { width: 1%; min-width: 40px; padding: 0 12px; text-align: right; color: var(--sg-text-muted); user-select: none; background: var(--sg-line-num-bg); border-right: 1px solid var(--sg-line-num-border); }
  .sg-line-code { padding: 0 16px; white-space: pre; }
  .sg-footer { padding: 8px 16px; background: var(--sg-bg-secondary); border-top: 1px solid var(--sg-border); font-size: 12px; color: var(--sg-text-muted); display: flex; justify-content: space-between; }
  .sg-footer a { color: var(--sg-text-muted); text-decoration: none; }
  .sg-footer a:hover { color: var(--sg-link); }
  .sg-collapsible .sg-toggle { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; font-size: 12px; color: var(--sg-text-secondary); background: none; border: 1px solid var(--sg-border); border-radius: 4px; cursor: pointer; }
  .sg-collapsible .sg-toggle:hover { background: var(--sg-line-hover); }
  .sg-collapsed .sg-toggle-icon { transform: rotate(-90deg); }
  .sg-collapsible .sg-content { transition: max-height 0.3s ease, opacity 0.2s ease; overflow: hidden; max-height: 5000px; opacity: 1; }
  .sg-collapsed .sg-content { max-height: 0; opacity: 0; }
  .sg-code .token.comment, .sg-code .token.prolog, .sg-code .token.doctype, .sg-code .token.cdata { color: #6a737d; }
  .sg-code .token.punctuation { color: #24292f; }
  .sg-code .token.property, .sg-code .token.tag, .sg-code .token.boolean, .sg-code .token.number, .sg-code .token.constant, .sg-code .token.symbol, .sg-code .token.deleted { color: #005cc5; }
  .sg-code .token.selector, .sg-code .token.attr-name, .sg-code .token.string, .sg-code .token.char, .sg-code .token.builtin, .sg-code .token.inserted { color: #22863a; }
  .sg-code .token.operator, .sg-code .token.entity, .sg-code .token.url, .sg-code .language-css .token.string, .sg-code .style .token.string { color: #d73a49; }
  .sg-code .token.atrule, .sg-code .token.attr-value, .sg-code .token.keyword { color: #d73a49; }
  .sg-code .token.function, .sg-code .token.class-name { color: #6f42c1; }
  .sg-code .token.regex, .sg-code .token.important, .sg-code .token.variable { color: #e36209; }
  @media (prefers-color-scheme: dark) {
    .sg-embed:not(.sg-theme-light) { --sg-bg: #0d1117; --sg-bg-secondary: #161b22; --sg-border: #30363d; --sg-text: #c9d1d9; --sg-text-secondary: #8b949e; --sg-text-muted: #484f58; --sg-link: #58a6ff; --sg-code-bg: #0d1117; --sg-line-num-bg: #161b22; --sg-line-num-border: #30363d; --sg-line-hover: #161b22; }
    .sg-embed:not(.sg-theme-light) .sg-topic { color: #58a6ff; background: #1f3a5f; }
    .sg-embed:not(.sg-theme-light) .token.comment, .sg-embed:not(.sg-theme-light) .token.prolog, .sg-embed:not(.sg-theme-light) .token.doctype, .sg-embed:not(.sg-theme-light) .token.cdata { color: #8b949e; }
    .sg-embed:not(.sg-theme-light) .token.punctuation { color: #c9d1d9; }
    .sg-embed:not(.sg-theme-light) .token.property, .sg-embed:not(.sg-theme-light) .token.tag, .sg-embed:not(.sg-theme-light) .token.boolean, .sg-embed:not(.sg-theme-light) .token.number, .sg-embed:not(.sg-theme-light) .token.constant, .sg-embed:not(.sg-theme-light) .token.symbol, .sg-embed:not(.sg-theme-light) .token.deleted { color: #79c0ff; }
    .sg-embed:not(.sg-theme-light) .token.selector, .sg-embed:not(.sg-theme-light) .token.attr-name, .sg-embed:not(.sg-theme-light) .token.string, .sg-embed:not(.sg-theme-light) .token.char, .sg-embed:not(.sg-theme-light) .token.builtin, .sg-embed:not(.sg-theme-light) .token.inserted { color: #7ee787; }
    .sg-embed:not(.sg-theme-light) .token.operator, .sg-embed:not(.sg-theme-light) .token.entity, .sg-embed:not(.sg-theme-light) .token.url, .sg-embed:not(.sg-theme-light) .language-css .token.string, .sg-embed:not(.sg-theme-light) .style .token.string { color: #ff7b72; }
    .sg-embed:not(.sg-theme-light) .token.atrule, .sg-embed:not(.sg-theme-light) .token.attr-value, .sg-embed:not(.sg-theme-light) .token.keyword { color: #ff7b72; }
    .sg-embed:not(.sg-theme-light) .token.function, .sg-embed:not(.sg-theme-light) .token.class-name { color: #d2a8ff; }
    .sg-embed:not(.sg-theme-light) .token.regex, .sg-embed:not(.sg-theme-light) .token.important, .sg-embed:not(.sg-theme-light) .token.variable { color: #ffa657; }
  }
  .sg-theme-dark { --sg-bg: #0d1117 !important; --sg-bg-secondary: #161b22 !important; --sg-border: #30363d !important; --sg-text: #c9d1d9 !important; --sg-text-secondary: #8b949e !important; --sg-text-muted: #484f58 !important; --sg-link: #58a6ff !important; --sg-code-bg: #0d1117 !important; --sg-line-num-bg: #161b22 !important; --sg-line-num-border: #30363d !important; --sg-line-hover: #161b22 !important; }
  .sg-theme-dark .sg-topic { color: #58a6ff !important; background: #1f3a5f !important; }
  .sg-theme-dark .token.comment, .sg-theme-dark .token.prolog, .sg-theme-dark .token.doctype, .sg-theme-dark .token.cdata { color: #8b949e !important; }
  .sg-theme-dark .token.punctuation { color: #c9d1d9 !important; }
  .sg-theme-dark .token.property, .sg-theme-dark .token.tag, .sg-theme-dark .token.boolean, .sg-theme-dark .token.number, .sg-theme-dark .token.constant, .sg-theme-dark .token.symbol, .sg-theme-dark .token.deleted { color: #79c0ff !important; }
  .sg-theme-dark .token.selector, .sg-theme-dark .token.attr-name, .sg-theme-dark .token.string, .sg-theme-dark .token.char, .sg-theme-dark .token.builtin, .sg-theme-dark .token.inserted { color: #7ee787 !important; }
  .sg-theme-dark .token.operator, .sg-theme-dark .token.entity, .sg-theme-dark .token.url, .sg-theme-dark .language-css .token.string, .sg-theme-dark .style .token.string { color: #ff7b72 !important; }
  .sg-theme-dark .token.atrule, .sg-theme-dark .token.attr-value, .sg-theme-dark .token.keyword { color: #ff7b72 !important; }
  .sg-theme-dark .token.function, .sg-theme-dark .token.class-name { color: #d2a8ff !important; }
  .sg-theme-dark .token.regex, .sg-theme-dark .token.important, .sg-theme-dark .token.variable { color: #ffa657 !important; }
  .sg-theme-light { --sg-bg: #ffffff !important; --sg-bg-secondary: #f6f8fa !important; --sg-border: #d0d7de !important; --sg-text: #24292f !important; --sg-text-secondary: #656d76 !important; --sg-text-muted: #8b949e !important; --sg-link: #0969da !important; --sg-code-bg: #ffffff !important; --sg-line-num-bg: #f6f8fa !important; --sg-line-num-border: #d0d7de !important; --sg-line-hover: #f6f8fa !important; }
  .sg-theme-light .sg-topic { color: #0969da !important; background: #ddf4ff !important; }
  .sg-theme-light .token.comment, .sg-theme-light .token.prolog, .sg-theme-light .token.doctype, .sg-theme-light .token.cdata { color: #6a737d !important; }
  .sg-theme-light .token.punctuation { color: #24292f !important; }
  .sg-theme-light .token.property, .sg-theme-light .token.tag, .sg-theme-light .token.boolean, .sg-theme-light .token.number, .sg-theme-light .token.constant, .sg-theme-light .token.symbol, .sg-theme-light .token.deleted { color: #005cc5 !important; }
  .sg-theme-light .token.selector, .sg-theme-light .token.attr-name, .sg-theme-light .token.string, .sg-theme-light .token.char, .sg-theme-light .token.builtin, .sg-theme-light .token.inserted { color: #22863a !important; }
  .sg-theme-light .token.operator, .sg-theme-light .token.entity, .sg-theme-light .token.url, .sg-theme-light .language-css .token.string, .sg-theme-light .style .token.string { color: #d73a49 !important; }
  .sg-theme-light .token.atrule, .sg-theme-light .token.attr-value, .sg-theme-light .token.keyword { color: #d73a49 !important; }
  .sg-theme-light .token.function, .sg-theme-light .token.class-name { color: #6f42c1 !important; }
  .sg-theme-light .token.regex, .sg-theme-light .token.important, .sg-theme-light .token.variable { color: #e36209 !important; }
</style>
<div class="sg-header">
  <a class="sg-title" href="${baseUrl}/gists/${id}" target="_blank">${escapeContent(gist.title || 'Untitled')}</a>
  <div class="sg-meta">
    ${collapsibleBtnHtml}
    <a class="sg-user" href="${baseUrl}/users/${escapeContent(gist.user?.username_normalized || '')}" target="_blank">${escapeContent(gist.user?.name || 'Anonymous')}</a>
    <span>\u00b7</span>
    <span>${formatDate(gist.created_at)}</span>
  </div>
</div>
<div class="sg-content">
  ${descriptionHtml}
  ${topicsHtml}
  ${tabsHtml}
  <div class="sg-files">${filesHtml}</div>
</div>
<div class="sg-footer">
  <span>via <a href="${baseUrl}" target="_blank">Sify Gist</a></span>
  <a href="${baseUrl}/gists/${id}" target="_blank">View on Sify Gist</a>
</div>
\`;

  var targetId = 'sify-gist-' + gistId;
  var target = document.getElementById(targetId);
  if (target) {
    target.appendChild(el);
  } else if (currentScript && currentScript.parentNode) {
    currentScript.parentNode.insertBefore(el, currentScript.nextSibling);
  }

  window._sgToggle = function(gid) {
    var c = document.querySelector('.sg-embed[data-gid="' + gid + '"]') || el;
    var collapsed = c.classList.toggle('sg-collapsed');
    if (collapsed) {
      localStorage.setItem('sg-collapsed-' + gid, 'true');
    } else {
      localStorage.removeItem('sg-collapsed-' + gid);
    }
  };

  el.setAttribute('data-gid', gistId);

  el.querySelectorAll('.sg-copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var content = this.getAttribute('data-content');
      navigator.clipboard.writeText(content).then(function() {
        btn.textContent = 'copied!';
        setTimeout(function() { btn.textContent = 'copy'; }, 2000);
      });
    });
  });

  el.querySelectorAll('.sg-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var idx = this.getAttribute('data-index');
      el.querySelectorAll('.sg-tab').forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      el.querySelectorAll('.sg-file').forEach(function(f) {
        f.style.display = f.getAttribute('data-index') === idx ? '' : 'none';
      });
    });
  });
})();
`.trim();

    return new NextResponse(jsCode, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
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

function escapeForJsTemplate(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

function escapeContent(str: string): string {
  return escapeForJsTemplate(escapeHtml(str));
}

function highlightCode(code: string, language: string): string {
  const actualLang = languageMap[language.toLowerCase()] || language.toLowerCase();
  try {
    if (Prism.languages[actualLang]) {
      return Prism.highlight(code, Prism.languages[actualLang], actualLang);
    }
    return Prism.highlight(code, Prism.languages.javascript, 'javascript');
  } catch {
    return escapeHtml(code);
  }
}

function generateCodeHtml(code: string, language: string): string {
  const highlighted = highlightCode(code, language);
  const escapedHighlighted = escapeForJsTemplate(highlighted);
  const lines = escapedHighlighted.split('\n');
  const lineCount = lines.length;
  const lineNumberWidth = String(lineCount).length * 0.6 + 1;

  const linesHtml = lines.map((line, index) => {
    const lineNum = index + 1;
    return `<tr>
      <td class="sg-line-num" style="width:${lineNumberWidth}em">${lineNum}</td>
      <td class="sg-line-code">${line || ' '}</td>
    </tr>`;
  }).join('');

  return `<table>${linesHtml}</table>`;
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
