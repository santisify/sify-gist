import { NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase-server';
import { getUserByEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: '邮箱不能为空' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 检查用户是否存在
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      // 为了安全考虑，即使用户不存在也返回成功消息
      return new Response(JSON.stringify({ 
        message: '如果该邮箱已注册，您将收到密码重置邮件' 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const supabase = getServerClient();

    // 使用 Supabase Auth 发送密码重置邮件
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (error) {
      console.error('发送密码重置邮件错误:', error);
      return new Response(JSON.stringify({ error: '发送密码重置邮件失败' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ 
      message: '如果该邮箱已注册，您将收到密码重置邮件' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('忘记密码错误:', error);
    return new Response(JSON.stringify({ error: '处理请求时发生错误' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
