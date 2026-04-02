import { NextRequest, NextResponse } from 'next/server';
import {
  createInvitation,
  getAllInvitations,
  deleteInvitation,
  isInvitationUsable,
} from '@/lib/invitations';
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

// GET /api/invitations - 获取所有邀请码（管理员）
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 检查是否是管理员
    if (!user.is_admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }
    
    const invitations = await getAllInvitations();
    
    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('获取邀请码失败:', error);
    return NextResponse.json({ error: '获取邀请码失败' }, { status: 500 });
  }
}

// POST /api/invitations - 创建新的邀请码（管理员）
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 检查是否是管理员
    if (!user.is_admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }
    
    const body = await request.json();
    const { expires_at, nb_max } = body;
    
    const invitation = await createInvitation({
      expires_at,
      nb_max: nb_max || 0,
    });
    
    return NextResponse.json({
      success: true,
      invitation,
      message: '邀请码创建成功',
    });
  } catch (error) {
    console.error('创建邀请码失败:', error);
    return NextResponse.json({ error: '创建邀请码失败' }, { status: 500 });
  }
}

// DELETE /api/invitations - 删除邀请码（管理员）
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 检查是否是管理员
    if (!user.is_admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');
    
    if (!invitationId) {
      return NextResponse.json({ error: '邀请码 ID 不能为空' }, { status: 400 });
    }
    
    const success = await deleteInvitation(parseInt(invitationId));
    
    if (!success) {
      return NextResponse.json({ error: '邀请码不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: '邀请码已删除' });
  } catch (error) {
    console.error('删除邀请码失败:', error);
    return NextResponse.json({ error: '删除邀请码失败' }, { status: 500 });
  }
}

// PUT /api/invitations - 验证邀请码（公开）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;
    
    if (!code) {
      return NextResponse.json({ error: '邀请码不能为空' }, { status: 400 });
    }
    
    const usable = await isInvitationUsable(code);
    
    return NextResponse.json({
      success: true,
      usable,
      message: usable ? '邀请码有效' : '邀请码无效或已过期',
    });
  } catch (error) {
    console.error('验证邀请码失败:', error);
    return NextResponse.json({ error: '验证邀请码失败' }, { status: 500 });
  }
}
