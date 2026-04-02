import { NextRequest, NextResponse } from 'next/server';
import {
  createSSHKey,
  getSSHKeysByUserId,
  deleteSSHKey,
  sshKeyExists,
} from '@/lib/ssh-keys';
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

// GET /api/ssh-keys - 获取当前用户的所有 SSH 密钥
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const keys = await getSSHKeysByUserId(user.id);
    
    // 不返回完整的密钥内容，只返回指纹信息
    const safeKeys = keys.map(key => ({
      id: key.id,
      title: key.title,
      sha: key.sha,
      created_at: key.created_at,
      last_used_at: key.last_used_at,
    }));
    
    return NextResponse.json({ keys: safeKeys });
  } catch (error) {
    console.error('获取 SSH 密钥失败:', error);
    return NextResponse.json({ error: '获取密钥失败' }, { status: 500 });
  }
}

// POST /api/ssh-keys - 添加新的 SSH 密钥
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const body = await request.json();
    const { title, content } = body;
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: '密钥标题不能为空' }, { status: 400 });
    }
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '密钥内容不能为空' }, { status: 400 });
    }
    
    // 检查密钥是否已存在
    const exists = await sshKeyExists(content);
    if (exists) {
      return NextResponse.json({ error: '该 SSH 密钥已被添加' }, { status: 409 });
    }
    
    // 验证 SSH 密钥格式（简单验证）
    const trimmedContent = content.trim();
    if (!trimmedContent.startsWith('ssh-')) {
      return NextResponse.json({ error: '无效的 SSH 公钥格式' }, { status: 400 });
    }
    
    const key = await createSSHKey({
      title,
      content: trimmedContent,
      user_id: user.id,
    });
    
    return NextResponse.json({
      success: true,
      key: {
        id: key.id,
        title: key.title,
        sha: key.sha,
        created_at: key.created_at,
      },
      message: 'SSH 密钥添加成功',
    });
  } catch (error) {
    console.error('添加 SSH 密钥失败:', error);
    return NextResponse.json({ error: '添加密钥失败' }, { status: 500 });
  }
}

// DELETE /api/ssh-keys - 删除 SSH 密钥
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');
    
    if (!keyId) {
      return NextResponse.json({ error: '密钥 ID 不能为空' }, { status: 400 });
    }
    
    const success = await deleteSSHKey(parseInt(keyId), user.id);
    
    if (!success) {
      return NextResponse.json({ error: '密钥不存在或无权删除' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'SSH 密钥已删除' });
  } catch (error) {
    console.error('删除 SSH 密钥失败:', error);
    return NextResponse.json({ error: '删除密钥失败' }, { status: 500 });
  }
}
