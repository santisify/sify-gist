import { NextRequest, NextResponse } from 'next/server';
import {
  createAccessToken,
  getAccessTokensByUserId,
  deleteAccessToken,
  verifyAccessToken,
} from '@/lib/access-tokens';
import { getUserFromRequest } from '@/lib/jwt';
import { getUserById } from '@/lib/auth';

// 辅助函数：验证用户并返回用户信息
async function verifyAuth(request: NextRequest) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return null;
  }
  return await getUserById(payload.userId);
}

// GET /api/tokens - 获取当前用户的所有访问令牌
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const tokens = await getAccessTokensByUserId(user.id);
    
    // 不返回 token_hash，只返回必要信息
    const safeTokens = tokens.map(token => ({
      id: token.id,
      name: token.name,
      scope_gist: token.scope_gist,
      created_at: token.created_at,
      expires_at: token.expires_at,
      last_used_at: token.last_used_at,
    }));
    
    return NextResponse.json({ tokens: safeTokens });
  } catch (error) {
    console.error('获取访问令牌失败:', error);
    return NextResponse.json({ error: '获取令牌失败' }, { status: 500 });
  }
}

// POST /api/tokens - 创建新的访问令牌
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, scope_gist, expires_at } = body;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: '令牌名称不能为空' }, { status: 400 });
    }
    
    if (scope_gist === undefined || ![0, 1, 2].includes(scope_gist)) {
      return NextResponse.json({ error: '无效的权限范围' }, { status: 400 });
    }
    
    const result = await createAccessToken({
      name,
      user_id: user.id,
      scope_gist,
      expires_at,
    });
    
    // 只在创建时返回明文令牌，之后无法再获取
    return NextResponse.json({
      success: true,
      token: {
        id: result.token.id,
        name: result.token.name,
        scope_gist: result.token.scope_gist,
        created_at: result.token.created_at,
        expires_at: result.token.expires_at,
      },
      plainToken: result.plainToken,
      message: '请妥善保管此令牌，系统不会再次显示',
    });
  } catch (error) {
    console.error('创建访问令牌失败:', error);
    return NextResponse.json({ error: '创建令牌失败' }, { status: 500 });
  }
}

// DELETE /api/tokens - 删除访问令牌
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('id');
    
    if (!tokenId) {
      return NextResponse.json({ error: '令牌 ID 不能为空' }, { status: 400 });
    }
    
    const success = await deleteAccessToken(parseInt(tokenId), user.id);
    
    if (!success) {
      return NextResponse.json({ error: '令牌不存在或无权删除' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: '令牌已删除' });
  } catch (error) {
    console.error('删除访问令牌失败:', error);
    return NextResponse.json({ error: '删除令牌失败' }, { status: 500 });
  }
}
