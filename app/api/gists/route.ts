// app/api/gists/route.ts
import { NextRequest } from 'next/server';
import { 
  getAllGists, 
  createGist, 
  CreateGistData, 
  searchGists,
  getGistsByUser,
  getGistsByTopic
} from '@/lib/gists';
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
    const currentUserId = searchParams.get('currentUserId');
    const topic = searchParams.get('topic');
    
    let result;
    
    if (topic) {
      // 按标签筛选
      result = await getGistsByTopic(topic, { page, limit });
    } else if (userId) {
      // 获取指定用户的 Gists
      result = await getGistsByUser(userId, currentUserId || undefined, { page, limit });
    } else if (query) {
      // 搜索模式
      result = await searchGists(
        { query, currentUserId: currentUserId || undefined },
        { page, limit }
      );
    } else {
      // 获取所有公开 Gists
      result = await getAllGists({ page, limit });
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
