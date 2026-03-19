// app/api/auth/register/route.ts
import { NextRequest } from 'next/server';
import { registerUser, getUserByEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: '姓名、邮箱和密码不能为空' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: '该邮箱已被注册' }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 密码长度验证
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: '密码长度不能少于6位' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const user = await registerUser({ name, email, password });

    if (!user) {
      return new Response(JSON.stringify({ error: '注册失败' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url
      },
      message: '注册成功'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return new Response(JSON.stringify({ error: '注册时发生错误' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}