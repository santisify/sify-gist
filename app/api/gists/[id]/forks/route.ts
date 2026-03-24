import { NextRequest, NextResponse } from 'next/server';
import { getGistForks } from '@/lib/gists';
import { initializeDatabase } from '@/app/init-db';

async function ensureDbInitialized() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('数据库初始化错误:', error);
  }
}

// 获取 Gist 的 Fork 列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const result = await getGistForks(id, { page, limit });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取 Fork 列表失败:', error);
    return NextResponse.json({ error: '获取 Fork 列表失败' }, { status: 500 });
  }
}
