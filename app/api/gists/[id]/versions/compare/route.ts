import { NextRequest, NextResponse } from 'next/server';
import { computeVersionDiff, validateVersionParams } from '@/lib/diff';
import { getUserIdFromRequest } from '@/lib/jwt';
import { getGistVersions } from '@/lib/gists';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const url = new URL(request.url);

    const fromVersion = parseInt(url.searchParams.get('from') || '1');
    const toVersionParam = url.searchParams.get('to') || 'latest';

    // 如果 toVersion 是 'latest'，需要获取最新版本号
    let toVersion: number;
    if (toVersionParam === 'latest') {
      const versions = await getGistVersions(gistId);
      if (versions.length === 0) {
        return NextResponse.json(
          { error: 'No versions found' },
          { status: 404 }
        );
      }
      toVersion = Math.max(...versions.map(v => v.version_number));
    } else {
      toVersion = parseInt(toVersionParam);
    }

    // 验证参数
    const validation = validateVersionParams(gistId, fromVersion, toVersion);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    if (fromVersion < 1 || toVersion < 1) {
      return NextResponse.json(
        { error: 'Invalid version numbers' },
        { status: 400 }
      );
    }

    if (fromVersion === toVersion) {
      return NextResponse.json(
        { error: 'Cannot compare the same version' },
        { status: 400 }
      );
    }

    // 计算差异
    const diff = await computeVersionDiff(gistId, fromVersion, toVersion);

    return NextResponse.json({
      ...diff,
      fromVersion,
      toVersion
    });
  } catch (error) {
    console.error('Error comparing versions:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Gist or version not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to compare versions' },
      { status: 500 }
    );
  }
}