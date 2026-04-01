import { NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase-server';
import { getUserByEmail } from '@/lib/auth';
import { nanoid } from 'nanoid';

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

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: '该邮箱已被注册' }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: '密码长度不能少于6位' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const supabase = getServerClient();

    // 使用 Supabase Auth 注册用户，启用邮箱验证
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          name: name,
        },
      },
    });

    if (authError) {
      console.error('Supabase 注册错误:', authError);
      
      // 处理特定的错误情况
      if (authError.message.includes('already registered')) {
        return new Response(JSON.stringify({ error: '该邮箱已被注册' }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      return new Response(JSON.stringify({ error: authError.message || '注册失败' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: '注册失败，未创建用户' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 在 users 表中创建用户记录
    const userId = authData.user.id;
    const now = new Date().toISOString();

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: name,
        email: email,
        password_hash: '', // 密码由 Supabase Auth 管理
        avatar_url: null,
        created_at: now,
        email_verified: false,
      });

    if (insertError) {
      console.error('创建用户记录错误:', insertError);
      // 尝试清理 Supabase Auth 中的用户
      await supabase.auth.admin.deleteUser(userId);
      
      return new Response(JSON.stringify({ error: '创建用户记录失败' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 检查用户是否需要邮箱验证
    const needsEmailVerification = !authData.session;

    return new Response(JSON.stringify({ 
      user: {
        id: userId,
        name: name,
        email: email,
        avatar_url: null
      },
      message: needsEmailVerification 
        ? '注册成功！请检查您的邮箱并点击验证链接以激活账户。'
        : '注册成功',
      needsEmailVerification
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
