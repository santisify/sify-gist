import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateTokenPair } from '@/lib/jwt';
import { getUserById } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: '缺少刷新令牌' },
        { status: 400 }
      );
    }

    // 验证刷新令牌
    const payload = verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return NextResponse.json(
        { error: '无效或过期的刷新令牌' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await getUserById(payload.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      );
    }

    // 生成新的令牌对
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      message: '令牌刷新成功',
    });
  } catch (error) {
    console.error('令牌刷新错误:', error);
    return NextResponse.json(
      { error: '令牌刷新失败' },
      { status: 500 }
    );
  }
}
