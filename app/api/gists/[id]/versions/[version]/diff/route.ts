import { NextRequest, NextResponse } from 'next/server';
import { computeVersionDiff, validateVersionParams } from '@/lib/diff';
import { getUserIdFromRequest } from '@/lib/jwt';

export async function GET(
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
    const toVersion = parseInt(params.version);

    // 从查询参数获取对比的版本，默认为上一版本
    const url = new URL(request.url);
    const fromVersionParam = url.searchParams.get('from');
    const fromVersion = fromVersionParam
      ? parseInt(fromVersionParam)
      : toVersion - 1;

    // 验证参数
    const validation = validateVersionParams(gistId, fromVersion, toVersion);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    if (fromVersion < 1) {
      return NextResponse.json(
        { error: 'Invalid from version' },
        { status: 400 }
      );
    }

    // 计算差异
    const diff = await computeVersionDiff(gistId, fromVersion, toVersion);

    return NextResponse.json(diff);
  } catch (error) {
    console.error('Error computing diff:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to compute diff' },
      { status: 500 }
    );
  }
}