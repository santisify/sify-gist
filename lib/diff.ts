import { diffLines, diffChars, Change } from 'diff';

export interface FileDiff {
  filename: string;
  language: string;
  changes: DiffChange[];
  stats: DiffStats;
}

export interface DiffChange {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumber?: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
}

export interface VersionDiff {
  gistId: string;
  fromVersion: number;
  toVersion: number;
  files: FileDiff[];
  overallStats: DiffStats;
  createdAt: string;
}

/**
 * 计算两个文件内容的差异
 */
export function computeFileDiff(
  oldContent: string,
  newContent: string,
  filename: string,
  language: string
): FileDiff {
  const changes: DiffChange[] = [];
  const diff = diffLines(oldContent, newContent);

  let oldLineNum = 1;
  let newLineNum = 1;

  for (const chunk of diff) {
    // 移除末尾的换行符，这样 split 就不会产生额外的空行
    let value = chunk.value;
    if (value.endsWith('\n')) {
      value = value.slice(0, -1);
    }

    const lines = value.split('\n');

    // 处理空内容的情况
    if (lines.length === 1 && lines[0] === '') {
      continue;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (chunk.added) {
        changes.push({
          type: 'added',
          value: line,
          lineNumber: newLineNum,
          newLineNumber: newLineNum
        });
        newLineNum++;
      } else if (chunk.removed) {
        changes.push({
          type: 'removed',
          value: line,
          lineNumber: oldLineNum,
          oldLineNumber: oldLineNum
        });
        oldLineNum++;
      } else {
        changes.push({
          type: 'unchanged',
          value: line,
          lineNumber: newLineNum,
          oldLineNumber: oldLineNum,
          newLineNumber: newLineNum
        });
        oldLineNum++;
        newLineNum++;
      }
    }
  }

  const stats = calculateDiffStats(changes);

  return {
    filename,
    language,
    changes,
    stats
  };
}

/**
 * 计算两个版本间的完整差异
 */
export async function computeVersionDiff(
  gistId: string,
  fromVersion: number,
  toVersion: number
): Promise<VersionDiff> {
  // 获取两个版本的文件
  const fromFiles = await getVersionFiles(gistId, fromVersion);
  const toFiles = await getVersionFiles(gistId, toVersion);

  const fileDiffs: FileDiff[] = [];
  let totalAdditions = 0;
  let totalDeletions = 0;
  let totalUnchanged = 0;

  // 处理所有文件
  const allFilenames = new Set([
    ...Object.keys(fromFiles),
    ...Object.keys(toFiles)
  ]);

  for (const filename of Array.from(allFilenames)) {
    const fromFile = fromFiles[filename];
    const toFile = toFiles[filename];

    let fileDiff: FileDiff;

    if (!fromFile) {
      // 新增文件
      fileDiff = {
        filename,
        language: toFile.language,
        changes: toFile.content.split('\n').map((line, index) => ({
          type: 'added' as const,
          value: line,
          lineNumber: index + 1,
          newLineNumber: index + 1
        })),
        stats: {
          additions: toFile.content.split('\n').length,
          deletions: 0,
          unchanged: 0
        }
      };
    } else if (!toFile) {
      // 删除文件
      fileDiff = {
        filename,
        language: fromFile.language,
        changes: fromFile.content.split('\n').map((line, index) => ({
          type: 'removed' as const,
          value: line,
          lineNumber: index + 1,
          oldLineNumber: index + 1
        })),
        stats: {
          additions: 0,
          deletions: fromFile.content.split('\n').length,
          unchanged: 0
        }
      };
    } else {
      // 修改文件
      fileDiff = computeFileDiff(
        fromFile.content,
        toFile.content,
        filename,
        toFile.language
      );
    }

    fileDiffs.push(fileDiff);
    totalAdditions += fileDiff.stats.additions;
    totalDeletions += fileDiff.stats.deletions;
    totalUnchanged += fileDiff.stats.unchanged;
  }

  return {
    gistId,
    fromVersion,
    toVersion,
    files: fileDiffs,
    overallStats: {
      additions: totalAdditions,
      deletions: totalDeletions,
      unchanged: totalUnchanged
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * 计算差异统计信息
 */
export function calculateDiffStats(changes: DiffChange[]): DiffStats {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const change of changes) {
    switch (change.type) {
      case 'added':
        additions++;
        break;
      case 'removed':
        deletions++;
        break;
      case 'unchanged':
        unchanged++;
        break;
    }
  }

  return { additions, deletions, unchanged };
}

/**
 * 获取指定版本的文件内容
 */
async function getVersionFiles(
  gistId: string,
  versionNumber: number
): Promise<Record<string, { content: string; language: string }>> {
  // 这里需要实现从数据库获取版本文件的逻辑
  // 临时实现 - 实际应该从 gist_file_versions 表获取
  const { getGistByVersion } = await import('./gists');
  const gist = await getGistByVersion(gistId, versionNumber);

  if (!gist) {
    throw new Error(`Version ${versionNumber} not found`);
  }

  const files: Record<string, { content: string; language: string }> = {};
  for (const file of gist.files) {
    files[file.filename] = {
      content: file.content,
      language: file.language
    };
  }

  return files;
}

/**
 * 验证版本参数
 */
export function validateVersionParams(
  gistId: string,
  fromVersion: number,
  toVersion: number
): { valid: boolean; error?: string } {
  if (!gistId || typeof gistId !== 'string') {
    return { valid: false, error: 'Invalid gist ID' };
  }

  if (!Number.isInteger(fromVersion) || fromVersion < 1) {
    return { valid: false, error: 'Invalid from version' };
  }

  if (!Number.isInteger(toVersion) || toVersion < 1) {
    return { valid: false, error: 'Invalid to version' };
  }

  return { valid: true };
}

/**
 * 格式化差异结果为统一格式
 */
export function formatDiffToUnified(diff: VersionDiff): string {
  let result = `--- a/gist-${diff.gistId} (version ${diff.fromVersion})\n`;
  result += `+++ b/gist-${diff.gistId} (version ${diff.toVersion})\n\n`;

  for (const file of diff.files) {
    result += `--- a/${file.filename}\n`;
    result += `+++ b/${file.filename}\n`;

    let oldLineNum = 1;
    let newLineNum = 1;

    for (const change of file.changes) {
      if (change.type === 'removed') {
        result += `-${change.value}\n`;
        oldLineNum++;
      } else if (change.type === 'added') {
        result += `+${change.value}\n`;
        newLineNum++;
      } else {
        result += ` ${change.value}\n`;
        oldLineNum++;
        newLineNum++;
      }
    }
    result += '\n';
  }

  return result;
}