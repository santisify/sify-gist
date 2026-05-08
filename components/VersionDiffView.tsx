'use client';

import React, { useState, useEffect } from 'react';
import { FileDiff, DiffChange } from '@/lib/diff';

interface VersionDiffViewProps {
  gistId: string;
  fromVersion: number;
  toVersion: number;
}

interface FileTab {
  filename: string;
  language: string;
  changes: DiffChange[];
  stats: {
    additions: number;
    deletions: number;
  };
}

export default function VersionDiffView({
  gistId,
  fromVersion,
  toVersion
}: VersionDiffViewProps) {
  const [files, setFiles] = useState<FileTab[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  useEffect(() => {
    const fetchDiff = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/gists/${gistId}/versions/compare?from=${fromVersion}&to=${toVersion}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch diff');
        }

        const data = await response.json();
        const fileTabs: FileTab[] = data.files.map((file: FileDiff) => ({
          filename: file.filename,
          language: file.language,
          changes: file.changes,
          stats: {
            additions: file.stats.additions,
            deletions: file.stats.deletions
          }
        }));

        setFiles(fileTabs);
        if (fileTabs.length > 0) {
          setActiveFile(fileTabs[0].filename);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDiff();
  }, [gistId, fromVersion, toVersion]);

  const renderUnifiedDiff = (changes: DiffChange[]) => {
    return (
      <div className="font-mono text-sm">
        {changes.map((change, index) => {
          let className = '';
          let prefix = '';

          switch (change.type) {
            case 'added':
              className = 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300';
              prefix = '+';
              break;
            case 'removed':
              className = 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300';
              prefix = '-';
              break;
            default:
              className = 'text-gray-700 dark:text-gray-300';
              prefix = ' ';
          }

          return (
            <div
              key={index}
              className={`flex ${className} hover:bg-opacity-80 transition-colors`}
            >
              <span className="w-12 text-right pr-2 text-gray-400 select-none">
                {change.oldLineNumber || ''}
              </span>
              <span className="w-12 text-right pr-2 text-gray-400 select-none">
                {change.newLineNumber || ''}
              </span>
              <span className="w-4 text-gray-400 select-none">{prefix}</span>
              <span className="flex-1 pl-2">{change.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSplitDiff = (changes: DiffChange[]) => {
    return (
      <div className="grid grid-cols-2 gap-0 font-mono text-sm">
        <div className="border-r border-gray-200 dark:border-gray-700">
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
            Version {fromVersion}
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {changes.map((change, index) => {
              if (change.type === 'added') return null;

              const className = change.type === 'removed'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                : 'text-gray-700 dark:text-gray-300';

              return (
                <div key={index} className={`px-4 py-1 ${className} hover:bg-opacity-80 transition-colors`}>
                  <span className="w-8 text-right inline-block mr-2 text-gray-400">
                    {change.oldLineNumber || ''}
                  </span>
                  {change.value}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
            Version {toVersion}
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {changes.map((change, index) => {
              if (change.type === 'removed') return null;

              const className = change.type === 'added'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'text-gray-700 dark:text-gray-300';

              return (
                <div key={index} className={`px-4 py-1 ${className} hover:bg-opacity-80 transition-colors`}>
                  <span className="w-8 text-right inline-block mr-2 text-gray-400">
                    {change.newLineNumber || ''}
                  </span>
                  {change.value}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Computing diff...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4 flex items-center justify-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Error: {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <div className="mb-2">✨</div>
        No changes between versions {fromVersion} and {toVersion}
      </div>
    );
  }

  const activeFileData = files.find(f => f.filename === activeFile);
  const totalAdditions = files.reduce((sum, file) => sum + file.stats.additions, 0);
  const totalDeletions = files.reduce((sum, file) => sum + file.stats.deletions, 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Comparing versions {fromVersion} → {toVersion}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {files.length} file{files.length !== 1 ? 's' : ''} changed
          </div>
          {totalAdditions > 0 && (
            <span className="text-sm text-green-600 font-medium">
              +{totalAdditions}
            </span>
          )}
          {totalDeletions > 0 && (
            <span className="text-sm text-red-600 font-medium">
              -{totalDeletions}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'unified'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Unified
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100'
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Split
            </button>
          </div>
        </div>
      </div>

      {/* 文件标签页 */}
      {files.length > 1 && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {files.map(file => (
              <button
                key={file.filename}
                onClick={() => setActiveFile(file.filename)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeFile === file.filename
                    ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span>{file.filename}</span>
                <div className="flex items-center gap-1 text-xs">
                  {file.stats.additions > 0 && (
                    <span className="text-green-600">+{file.stats.additions}</span>
                  )}
                  {file.stats.deletions > 0 && (
                    <span className="text-red-600">-{file.stats.deletions}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 差异内容 */}
      {activeFileData && (
        <div className="overflow-auto max-h-96">
          {viewMode === 'unified'
            ? renderUnifiedDiff(activeFileData.changes)
            : renderSplitDiff(activeFileData.changes)
          }
        </div>
      )}
    </div>
  );
}