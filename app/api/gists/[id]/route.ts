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
    
    // 可见性检查
    if (gist.visibility === 'private') {
      // 从请求头获取当前用户信息
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      // 简单验证：私有 Gist 只有创建者可以访问
      // 在实际应用中，这里应该使用 JWT 验证
      const currentUserId = request.headers.get('X-User-Id');
      
      if (!currentUserId || currentUserId !== gist.user_id) {
        return new Response(JSON.stringify({ error: '没有权限访问此 Gist' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    }
    
    // public 和 unlisted 都可以访问（unlisted 需要知道链接）
    
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
    
    // 先获取 gist 检查权限
    const existingGist = await getGistById(params.id);
    if (!existingGist) {
      return new Response(JSON.stringify({ error: 'Gist 不存在' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // 权限检查：只有创建者可以更新
    const currentUserId = request.headers.get('X-User-Id');
    if (!currentUserId || currentUserId !== existingGist.user_id) {
      return new Response(JSON.stringify({ error: '没有权限更新此 Gist' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const data: Partial<CreateGistData> = await request.json();
    const updatedGist = await updateGist(params.id, data);
    
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
    
    // 先获取 gist 检查权限
    const existingGist = await getGistById(params.id);
    if (!existingGist) {
      return new Response(JSON.stringify({ error: 'Gist 不存在' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // 权限检查：只有创建者可以删除
    const currentUserId = request.headers.get('X-User-Id');
    if (!currentUserId || currentUserId !== existingGist.user_id) {
      return new Response(JSON.stringify({ error: '没有权限删除此 Gist' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const deleted = await deleteGist(params.id);
    
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
