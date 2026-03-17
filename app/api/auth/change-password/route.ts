// app/api/auth/change-password/route.ts
import { NextRequest } from 'next/server';
import { select, update } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // 从请求体中获取密码信息和用户邮箱
    const { currentPassword, newPassword, userEmail } = await request.json();

    if (!currentPassword || !newPassword || !userEmail) {
      return new Response(JSON.stringify({ error: '当前密码、新密码和用户邮箱不能为空' }), {
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

    // 查找用户，包含密码哈希
    const users = await select('users', {
      where: { email: userEmail }
    });
    
    if (users.length === 0) {
      return new Response(JSON.stringify({ error: '用户不存在' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const user = users[0];
    
    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: '当前密码错误' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 更新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await update('users', { password_hash: hashedNewPassword }, { id: user.id });

    if (!result) {
      return new Response(JSON.stringify({ error: '更新密码失败' }), {
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