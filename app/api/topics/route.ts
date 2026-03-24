import { NextRequest, NextResponse } from 'next/server';
import { getPopularTopics, getGistsByTopic } from '@/lib/gists';
import { initializeDatabase } from '@/app/init-db';

async function ensureDbInitialized() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('数据库初始化错误:', error);
  }
}

// 获取热门标签
export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    const topics = await getPopularTopics(limit);
    
    return NextResponse.json(topics);
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json({ error: '获取标签失败' }, { status: 500 });
  }
}
