import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getGistById } from '@/lib/gists';
import { getUserIdFromRequest } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gistId = params.id;
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    const gist = await getGistById(gistId);
    if (!gist) {
      return Response.json({ error: 'Gist不存在' }, { status: 404 });
    }
    
    const { data, error } = await supabase
      .from('gist_stars')
      .insert([{ user_id: userId, gist_id: gistId }]);
    
    if (error) {
      if (error.code === '23505') {
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
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
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
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return Response.json({ isStarred: false }, { status: 200 });
    }
    
    const supabase = getSupabaseClient();
    
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
