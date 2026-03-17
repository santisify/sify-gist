// app/api/gists/[id]/versions/[version]/route.ts
import { NextRequest } from 'next/server';
import { getGistByVersion } from '@/lib/gists';
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
  { params }: { params: { id: string; version: string } }
) {
  try {
    await ensureDbInitialized();
    
    const versionNumber = parseInt(params.version, 10);
    
    if (isNaN(versionNumber)) {
      return new Response(JSON.stringify({ error: '无效的版本号' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const gist = await getGistByVersion(params.id, versionNumber);
    
    if (!gist) {
      return new Response(JSON.stringify({ error: 'Gist 版本未找到' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify(gist), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('获取 Gist 版本时出错:', error);
    return new Response(JSON.stringify({ error: '获取 Gist 版本失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}