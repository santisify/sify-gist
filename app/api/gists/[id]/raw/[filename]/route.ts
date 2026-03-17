// app/api/gists/[id]/raw/[filename]/route.ts
import { NextRequest } from 'next/server';
import { getGistById } from '@/lib/gists';
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
  { params }: { params: { id: string; filename: string } }
) {
  try {
    await ensureDbInitialized();
    const gist = await getGistById(params.id);
    
    if (!gist) {
      return new Response('Gist 不存在', {
        status: 404,
      });
    }
    
    // 查找指定的文件
    const file = gist.files.find(f => f.filename === params.filename);
    
    if (!file) {
      return new Response('文件不存在', {
        status: 404,
      });
    }
    
    // 返回原始文件内容
    return new Response(file.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('获取原始文件内容时出错:', error);
    return new Response('服务器错误', {
      status: 500,
    });
  }
}