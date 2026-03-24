import { NextRequest } from 'next/server';
import { 
  getAllGists, 
  createGist, 
  CreateGistData, 
  searchGists,
  getGistsByUser,
  getGistsByTopic
} from '@/lib/gists';
import { getUserIdFromRequest } from '@/lib/jwt';
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
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const query = searchParams.get('q') || searchParams.get('query');
    const userId = searchParams.get('userId');
    const topic = searchParams.get('topic');
    
    // 从 JWT 获取当前用户 ID
    const currentUserId = getUserIdFromRequest(request);
    
    let result;
    
    if (topic) {
      result = await getGistsByTopic(topic, { page, limit });
    } else if (userId) {
      result = await getGistsByUser(userId, currentUserId || undefined, { page, limit });
    } else if (query) {
      result = await searchGists(
        { query, currentUserId: currentUserId || undefined },
        { page, limit }
      );
    } else {
      result = await getAllGists({ page, limit }, { currentUserId: currentUserId || undefined });
    }
    
    return new Response(JSON.stringify(result), {
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
    
    // 从 JWT 获取用户 ID
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return new Response(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const data: CreateGistData = await request.json();
    data.user_id = userId;
    
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