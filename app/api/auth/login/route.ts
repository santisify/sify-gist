import { NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { generateTokenPair } from '@/lib/jwt';

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

    // 使用 JWT 生成令牌对
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    
    return new Response(JSON.stringify({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
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
