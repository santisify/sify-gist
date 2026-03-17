// app/api/gists/[id]/versions/route.ts
import { NextRequest } from 'next/server';
import { getGistVersions } from '@/lib/gists';
import { initializeDatabase } from '@/app/init-db';

async function ensureDbInitialized() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('数据库初始化错误:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const versions = await getGistVersions(params.id);
    
    return new Response(JSON.stringify(versions), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('获取版本历史时出错:', error);
    return new Response(JSON.stringify({ error: '获取版本历史失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}