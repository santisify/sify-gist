// app/api/gists/[id]/star/route.ts
import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getGistById } from '@/lib/gists';

// 修复Next.js构建错误
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gistId = params.id;
    
    // 从请求头获取用户信息（实际项目中可能需要验证token）
    const userId = request.headers.get('user-id');
    if (!userId) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // 检查Gist是否存在
    const gist = await getGistById(gistId);
    if (!gist) {
      return Response.json({ error: 'Gist不存在' }, { status: 404 });
    }
    
    // 添加收藏记录
    const { data, error } = await supabase
      .from('gist_stars')
      .insert([{ user_id: userId, gist_id: gistId }]);
    
    if (error) {
      if (error.code === '23505') { // PostgreSQL unique violation code
        return Response.json({ error: '已经收藏过此Gist' }, { status: 400 });
      }
      console.error('收藏Gist时出错:', error);
      throw error;
    }
    
    return Response.json({ message: 'Gist已收藏' }, { status: 200 });
  } catch (error) {
    console.error('收藏Gist时出错:', error);
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gistId = params.id;
    
    // 从请求头获取用户信息
    const userId = request.headers.get('user-id');
    if (!userId) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // 删除收藏记录
    const { data, error } = await supabase
      .from('gist_stars')
      .delete()
      .match({ user_id: userId, gist_id: gistId });
    
    if (error) {
      console.error('取消收藏Gist时出错:', error);
      return Response.json({ error: '服务器错误' }, { status: 500 });
    }
    
    if (!data) {
      return Response.json({ error: '未收藏此Gist' }, { status: 400 });
    }
    
    return Response.json({ message: 'Gist已取消收藏' }, { status: 200 });
  } catch (error) {
    console.error('取消收藏Gist时出错:', error);
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gistId = params.id;
    
    // 从请求头获取用户信息
    const userId = request.headers.get('user-id');
    if (!userId) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // 检查是否已收藏
    const { data, error } = await supabase
      .from('gist_stars')
      .select('*')
      .match({ user_id: userId, gist_id: gistId });
    
    if (error) {
      console.error('检查收藏状态时出错:', error);
      return Response.json({ error: '服务器错误' }, { status: 500 });
    }
    
    const isStarred = data && data.length > 0;
    
    return Response.json({ isStarred }, { status: 200 });
  } catch (error) {
    console.error('检查收藏状态时出错:', error);
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}