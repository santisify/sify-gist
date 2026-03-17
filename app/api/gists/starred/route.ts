// app/api/gists/starred/route.ts
import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { Gist, File } from '@/lib/gists';

// 修复Next.js构建错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取用户信息
    const userId = request.headers.get('user-id');
    if (!userId) {
      return Response.json({ error: '未授权' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // 首先获取用户收藏的 gist ID 列表
    const { data: starredIds, error: starredError } = await supabase
      .from('gist_stars')
      .select('gist_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (starredError) {
      console.error('获取收藏的Gists时出错:', starredError);
      return Response.json({ error: '服务器错误' }, { status: 500 });
    }
    
    if (!starredIds || starredIds.length === 0) {
      return Response.json([], { status: 200 });
    }
    
    // 获取对应的 gist 信息
    const gistIds = starredIds.map(item => item.gist_id);
    const { data: gistsData, error: gistsError } = await supabase
      .from('gists')
      .select('*')
      .in('id', gistIds);
    
    if (gistsError) {
      console.error('获取Gists数据时出错:', gistsError);
      return Response.json({ error: '服务器错误' }, { status: 500 });
    }
    
    const starredGists: Gist[] = [];
    
    if (gistsData) {
      for (const gistData of gistsData) {
        // 获取该 gist 的所有文件
        const { data: filesData, error: filesError } = await supabase
          .from('gist_files')
          .select('*')
          .eq('gist_id', gistData.id);
        
        if (filesError) {
          console.error('获取Gist文件时出错:', filesError);
          continue; // 跳过这个gist
        }
        
        const files: File[] = filesData.map((fileRow: any) => ({
          id: fileRow.id,
          gist_id: fileRow.gist_id,
          filename: fileRow.filename,
          content: fileRow.content,
          language: fileRow.language
        }));

        starredGists.push({
          id: gistData.id as string,
          user_id: gistData.user_id as string,
          title: gistData.title as string,
          description: gistData.description as string,
          created_at: gistData.created_at as string,
          updated_at: gistData.updated_at as string,
          files: files
        });
      }
    }

    // 按照用户收藏的时间顺序排序
    const sortedGists = starredGists.sort((a, b) => {
      const aIndex = gistIds.indexOf(a.id);
      const bIndex = gistIds.indexOf(b.id);
      return aIndex - bIndex; // 按照收藏顺序排序
    });

    return Response.json(sortedGists, { status: 200 });
  } catch (error) {
    console.error('获取收藏的Gists时出错:', error);
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}