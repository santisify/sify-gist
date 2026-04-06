import { NextRequest, NextResponse } from 'next/server';
import { getTrendingGists } from '@/lib/gists';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const gravity = parseFloat(searchParams.get('gravity') || '1.8');

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: '无效的分页参数' },
        { status: 400 }
      );
    }

    const result = await getTrendingGists(
      { page, limit },
      { gravity, daysLimit: days }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取热门趋势 Gists 失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}