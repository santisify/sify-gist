import { NextRequest, NextResponse } from 'next/server';
import { updateGist } from '@/lib/gists';
import { getUserIdFromRequest } from '@/lib/jwt';
import { getGistByVersion } from '@/lib/gists';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; version: string } }
) {
  try {
    // 身份验证
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const gistId = params.id;
    const versionNumber = parseInt(params.version);

    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid version number' },
        { status: 400 }
      );
    }

    // 获取要恢复的版本
    const versionGist = await getGistByVersion(gistId, versionNumber);
    if (!versionGist) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // 检查权限 - 只有 Gist 所有者可以回滚
    if (versionGist.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Only the gist owner can restore versions' },
        { status: 403 }
      );
    }

    // 检查是否有文件可以恢复
    if (!versionGist.files || versionGist.files.length === 0) {
      return NextResponse.json(
        { error: 'No files to restore' },
        { status: 400 }
      );
    }

    // 恢复文件内容
    const updatedGist = await updateGist(gistId, {
      files: versionGist.files
    });

    if (!updatedGist) {
      return NextResponse.json(
        { error: 'Failed to restore version' },
        { status: 500 }
      );
    }

    // 记录回滚操作（这里可以添加审计日志）
    console.log(`User ${userId} restored gist ${gistId} to version ${versionNumber} at ${new Date().toISOString()}`);

    return NextResponse.json({
      message: `Successfully restored to version ${versionNumber}`,
      gist: updatedGist,
      restoredVersion: versionNumber,
      restoredAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error restoring version:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Gist or version not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    );
  }
}