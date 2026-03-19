// app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: '邮箱和密码不能为空' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const user = await authenticateUser({ email, password });

    if (!user) {
      return new Response(JSON.stringify({ error: '邮箱或密码错误' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 生成一个简单的 token（在实际应用中应使用 JWT）
    const token = `token_${nanoid(32)}`;
    
    return new Response(JSON.stringify({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url
      },
      token: token,
      message: '登录成功'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    return new Response(JSON.stringify({ error: '登录时发生错误' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}