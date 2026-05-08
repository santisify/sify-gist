'use client';

import React, { useState, useEffect } from 'react';
import { GistVersion } from '@/lib/gists';

interface VersionPickerProps {
  gistId: string;
  selectedVersion?: number;
  onVersionChange: (version: number) => void;
  label?: string;
  className?: string;
}

export default function VersionPicker({
  gistId,
  selectedVersion,
  onVersionChange,
  label = 'Version',
  className = ''
}: VersionPickerProps) {
  const [versions, setVersions] = useState<GistVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/gists/${gistId}/versions`);

        if (!response.ok) {
          throw new Error('Failed to fetch versions');
        }

        const data = await response.json();
        setVersions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Failed to fetch versions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (gistId) {
      fetchVersions();
    }
  }, [gistId]);

  const formatVersionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}:
        </label>
        <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}:
        </label>
        <div className="text-sm text-red-500">
          Error loading versions
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}:
        </label>
        <div className="text-sm text-gray-500">
          No versions available
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}:
      </label>
      <div className="relative">
        <select
          value={selectedVersion || ''}
          onChange={(e) => onVersionChange(parseInt(e.target.value))}
          className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select version...</option>
          {versions.map(version => (
            <option key={version.id} value={version.version_number}>
              v{version.version_number} - {formatVersionDate(version.created_at)}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {selectedVersion && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {versions.find(v => v.version_number === selectedVersion) &&
            formatVersionDate(versions.find(v => v.version_number === selectedVersion)!.created_at)
          }
        </div>
      )}
    </div>
  );
}