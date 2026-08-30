'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VersionDiffView from '@/components/VersionDiffView';
import VersionPicker from '@/components/VersionPicker';
import { GistVersion } from '@/lib/gists';

export default function VersionCompareClient() {
  const params = useParams();
  const router = useRouter();
  const gistId = params.id as string;

  const [versions, setVersions] = useState<GistVersion[]>([]);
  const [fromVersion, setFromVersion] = useState<number | null>(null);
  const [toVersion, setToVersion] = useState<number | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch(`/api/gists/${gistId}/versions`);
        if (response.ok) {
          const data = await response.json();
          setVersions(data || []);

          if (data && data.length >= 2) {
            // 默认选择最新的两个版本
            const latestVersions = data.slice(0, 2);
            setFromVersion(latestVersions[1].version_number);
            setToVersion(latestVersions[0].version_number);
          }
        }
      } catch (error) {
        console.error('Failed to fetch versions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (gistId) {
      fetchVersions();
    }
  }, [gistId]);

  const handleCompare = () => {
    if (fromVersion && toVersion && fromVersion !== toVersion) {
      setIsComparing(true);
    }
  };

  const handleVersionsChange = (newFrom: number, newTo: number) => {
    setFromVersion(newFrom);
    setToVersion(newTo);
    setIsComparing(false);
  };

  const canCompare = fromVersion && toVersion && fromVersion !== toVersion;

  if (loading) {
    return (
      <div className="container-main py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="container-main py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No version history available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This gist doesn't have multiple versions to compare.
            </p>
            <button
              onClick={() => router.push(`/gists/${gistId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Back to Gist
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (versions.length === 1) {
    return (
      <div className="container-main py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 11-4 0m4 0a2 2 0 104 0m0 0v2m0-6V4m6 6v10m6-2a2 2 0 11-4 0m4 0a2 2 0 104 0m0 0v-2m0 6v2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Only one version available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You need at least two versions to compare changes.
            </p>
            <button
              onClick={() => router.push(`/gists/${gistId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Back to Gist
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Compare Versions
            </h1>
            <button
              onClick={() => router.push(`/gists/${gistId}`)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              ← Back to Gist
            </button>
          </div>

          {/* 版本选择器 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <VersionPicker
                gistId={gistId}
                selectedVersion={fromVersion || undefined}
                onVersionChange={(version) => setFromVersion(version)}
                label="From"
              />

              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              <VersionPicker
                gistId={gistId}
                selectedVersion={toVersion || undefined}
                onVersionChange={(version) => setToVersion(version)}
                label="To"
              />

              <button
                onClick={handleCompare}
                disabled={!canCompare}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  canCompare
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Compare
              </button>
            </div>

            {!canCompare && fromVersion && toVersion && fromVersion === toVersion && (
              <div className="text-sm text-amber-600 dark:text-amber-400">
                Please select two different versions to compare.
              </div>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select two different versions to see the changes between them. The comparison will show additions, deletions, and modifications.
            </p>
          </div>
        </div>

        {/* 差异显示 */}
        {isComparing && fromVersion && toVersion && (
          <div className="mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-accent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">
                  Comparing version {fromVersion} → {toVersion}
                </span>
              </div>
            </div>

            <VersionDiffView
              gistId={gistId}
              fromVersion={fromVersion}
              toVersion={toVersion}
            />
          </div>
        )}

        {/* 版本历史信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Version History
          </h3>
          <div className="space-y-2">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  version.version_number === fromVersion || version.version_number === toVersion
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium">
                    v{version.version_number}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(version.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {(version.version_number === fromVersion || version.version_number === toVersion) && (
                    <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                      {version.version_number === fromVersion ? 'From' : 'To'}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {version.files.length} file{version.files.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}