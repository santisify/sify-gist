import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserFromRequest } from '@/lib/jwt';
import { getUserById } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    
    if (!payload) {
      return NextResponse.json(
        { error: '无效或过期的认证令牌', authenticated: false },
        { status: 401 }
      );
    }

    // 获取最新的用户信息
    const user = await getUserById(payload.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在', authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
      message: '认证成功',
    });
  } catch (error) {
    console.error('认证检查错误:', error);
    return NextResponse.json(
      { error: '认证检查失败', authenticated: false },
      { status: 500 }
    );
  }
}
