import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, updateSettings, initializeDefaultSettings } from '@/lib/admin-settings';
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

// GET /api/admin/settings - 获取所有管理员设置
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
    
    const settings = await getAllSettings();
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('获取管理员设置失败:', error);
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 });
  }
}

// POST /api/admin/settings - 更新管理员设置
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
    const { settings } = body;
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: '无效的设置数据' }, { status: 400 });
    }
    
    await updateSettings(settings);
    
    return NextResponse.json({ success: true, message: '设置已更新' });
  } catch (error) {
    console.error('更新管理员设置失败:', error);
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 });
  }
}

// PUT /api/admin/settings - 初始化默认设置
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 检查是否是管理员
    if (!user.is_admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }
    
    await initializeDefaultSettings();
    
    return NextResponse.json({ success: true, message: '默认设置已初始化' });
  } catch (error) {
    console.error('初始化默认设置失败:', error);
    return NextResponse.json({ error: '初始化失败' }, { status: 500 });
  }
}
