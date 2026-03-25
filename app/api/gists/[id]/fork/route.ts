import { NextRequest, NextResponse } from 'next/server';
import { forkGist, hasUserForked } from '@/lib/gists';
import { getUserIdFromRequest } from '@/lib/jwt';

// 检查是否已 fork
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ hasForked: false, forkId: null });
    }

    const forkId = await hasUserForked(id, userId);
    
    return NextResponse.json({ 
      hasForked: !!forkId, 
      forkId 
    });
  } catch (error) {
    console.error('检查 Fork 状态失败:', error);
    return NextResponse.json(
      { error: '检查 Fork 状态失败' },
      { status: 500 }
    );
  }
}

// Fork 一个 Gist
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const forkedGist = await forkGist(id, userId);
    
    return NextResponse.json(forkedGist, { status: 201 });
  } catch (error: any) {
    console.error('Fork Gist 失败:', error);
    
    if (error.message === '您已经 fork 过这个 Gist') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Fork Gist 失败' },
      { status: 500 }
    );
  }
}