// app/api/gists/route.ts
import { NextRequest } from 'next/server';
import { getAllGists, createGist, getGistById, updateGist, deleteGist, CreateGistData } from '@/lib/gists';
import { initializeDatabase } from '@/app/init-db';

async function ensureDbInitialized() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('数据库初始化错误:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    // 从查询参数获取用户ID
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let gists;
    if (userId) {
      // 如果提供了用户ID，获取该用户创建的Gists
      const { getGistsByUser } = await import('@/lib/gists');
      gists = await getGistsByUser(userId);
    } else {
      // 否则，获取所有Gists
      gists = await getAllGists();
    }
    
    return new Response(JSON.stringify(gists), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('获取 Gists 失败:', error);
    return new Response(JSON.stringify({ error: '获取 Gists 失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const data: CreateGistData = await request.json();
    const newGist = await createGist(data);
    
    return new Response(JSON.stringify(newGist), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('创建 Gist 失败:', error);
    return new Response(JSON.stringify({ error: '创建 Gist 失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}