import { NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase-server';
import { generateTokenPair } from '@/lib/jwt';
import { getUserByEmail } from '@/lib/auth';

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

    const supabase = getServerClient();

    // 使用 Supabase Auth 登录
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase 登录错误:', authError);
      
      if (authError.message.includes('Invalid login credentials')) {
        return new Response(JSON.stringify({ error: '邮箱或密码错误' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      if (authError.message.includes('Email not confirmed')) {
        return new Response(JSON.stringify({ 
          error: '请先验证您的邮箱地址',
          needsEmailVerification: true 
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      return new Response(JSON.stringify({ error: authError.message || '登录失败' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: '登录失败，未找到用户' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 检查用户是否已验证邮箱
    if (!authData.user.email_confirmed_at) {
      return new Response(JSON.stringify({ 
        error: '请先验证您的邮箱地址',
        needsEmailVerification: true,
        email: email
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 从 users 表获取用户信息
    const userProfile = await getUserByEmail(email);
    
    if (!userProfile) {
      console.error('用户配置不存在:', email);
      return new Response(JSON.stringify({ error: '用户配置不存在，请联系管理员' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 使用 JWT 生成令牌对
    const tokens = generateTokenPair({
      userId: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
    });
    
    return new Response(JSON.stringify({ 
      user: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        avatar_url: userProfile.avatar_url
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
