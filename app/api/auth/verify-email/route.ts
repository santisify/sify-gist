import { NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: '用户ID不能为空' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const supabase = getServerClient();

    // 更新 users 表中的 email_verified 字段
    const { error } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', userId);

    if (error) {
      console.error('更新邮箱验证状态错误:', error);
      return new Response(JSON.stringify({ error: '更新邮箱验证状态失败' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ 
      message: '邮箱验证状态已更新' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('邮箱验证错误:', error);
    return new Response(JSON.stringify({ error: '处理请求时发生错误' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
