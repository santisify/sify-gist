// lib/format.ts
// Shared display helpers used across page-client components.

export interface PreviewResult {
  content: string;
  truncated: boolean;
  totalLines: number;
}

/**
 * Format an ISO/UTC timestamp as a relative "time ago" string.
 * The database stores UTC timestamps; we append a `Z` suffix if missing
 * so the value is parsed as UTC regardless of host locale.
 */
export function getTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const utcStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
  const date = new Date(utcStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "1 file" / "3 files" */
export function getFileCount(fileCount: number): string {
  return fileCount === 1 ? '1 file' : `${fileCount} files`;
}

/** Take the first N lines of a string for list-card previews. */
export function getPreviewLines(content: string, maxLines: number): PreviewResult {
  const lines = content.split('\n');
  const totalLines = lines.length;
  if (totalLines > maxLines) {
    return {
      content: lines.slice(0, maxLines).join('\n'),
      truncated: true,
      totalLines,
    };
  }
  return { content, truncated: false, totalLines };
}
