// app/api/auth/change-password/route.ts
import { NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase-server';
import { getUserByEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword, userEmail, accessToken } = body;

    // 支持两种密码修改方式：
    // 1. 通过邮件链接重置密码（使用 accessToken）
    // 2. 传统方式（需要当前密码和用户邮箱）

    if (!newPassword) {
      return new Response(JSON.stringify({ error: '新密码不能为空' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: '新密码长度不能少于6位' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const supabase = getServerClient();

    // 方式1: 通过邮件链接重置密码（使用 accessToken）
    if (accessToken) {
      // 使用 access token 更新密码
      const { error } = await supabase.auth.updateUser(
        { password: newPassword },
        { 
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (error) {
        console.error('重置密码错误:', error);
        
        if (error.message.includes('expired')) {
          return new Response(JSON.stringify({ error: '重置链接已过期，请重新申请' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }
        
        return new Response(JSON.stringify({ error: error.message || '密码重置失败' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      return new Response(JSON.stringify({ 
        message: '密码重置成功' 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 方式2: 传统方式（需要当前密码和用户邮箱）
    if (!currentPassword || !userEmail) {
      return new Response(JSON.stringify({ error: '当前密码和用户邮箱不能为空' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 验证用户是否存在
    const existingUser = await getUserByEmail(userEmail);
    if (!existingUser) {
      return new Response(JSON.stringify({ error: '用户不存在' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 使用 Supabase Auth 验证当前密码
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInError) {
      return new Response(JSON.stringify({ error: '当前密码错误' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 更新密码
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('更新密码错误:', updateError);
      return new Response(JSON.stringify({ error: updateError.message || '密码更新失败' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ 
      message: '密码修改成功' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('密码修改错误:', error);
    return new Response(JSON.stringify({ error: '密码修改时发生错误' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}