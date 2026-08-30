'use client';

import { Visibility } from './gists';

interface VisibilityBadgeProps {
  visibility: Visibility | 'public' | 'unlisted' | 'private';
  className?: string;
}

/**
 * Shared visibility badge. Accepts either the numeric Visibility enum
 * (0/1/2) used by lib/gists or the string form used by some API responses.
 * Public gists render nothing — a badge only marks deviating states.
 */
export default function VisibilityBadge({ visibility, className = '' }: VisibilityBadgeProps) {
  const isPrivate =
    visibility === 2 ||
    visibility === 'private';
  const isUnlisted =
    visibility === 1 ||
    visibility === 'unlisted';

  if (isPrivate) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${className}`}
        style={{ backgroundColor: 'rgba(220, 38, 38, 0.12)', color: 'var(--color-danger)' }}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        私有
      </span>
    );
  }

  if (isUnlisted) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${className}`}
        style={{ backgroundColor: 'rgba(217, 119, 6, 0.12)', color: 'var(--color-warning)' }}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
        未列出
      </span>
    );
  }

  return null;
}
