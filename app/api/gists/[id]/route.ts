// app/api/gists/[id]/route.ts
import { NextRequest } from 'next/server';
import { getGistById, updateGist, deleteGist, CreateGistData } from '@/lib/gists';
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
    const gist = await getGistById(params.id);
    
    if (!gist) {
      return new Response(JSON.stringify({ error: 'Gist 不存在' }), {
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
    console.error('获取 Gist 失败:', error);
    return new Response(JSON.stringify({ error: '获取 Gist 失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const data: Partial<CreateGistData> = await request.json();
    const updatedGist = await updateGist(params.id, data);
    
    if (!updatedGist) {
      return new Response(JSON.stringify({ error: 'Gist 不存在' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify(updatedGist), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('更新 Gist 失败:', error);
    return new Response(JSON.stringify({ error: '更新 Gist 失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const deleted = await deleteGist(params.id);
    
    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Gist 不存在' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify({ message: 'Gist 已删除' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('删除 Gist 失败:', error);
    return new Response(JSON.stringify({ error: '删除 Gist 失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}