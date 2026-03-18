export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import select, { update } from '@/lib/db';
import { uploadAvatarServer, deleteAvatarServer, isValidImageType, isValidFileSize } from '@/lib/avatar';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: '用户ID是必需的' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 查询数据库获取用户头像URL
    const users = await select('users', { where: { id: userId } });

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ error: '用户不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = users[0];
    const avatarUrl = user.avatar_url ? user.avatar_url : null;

    return new Response(
      JSON.stringify({ avatar_url: avatarUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('获取头像时出错:', error);
    return new Response(
      JSON.stringify({ error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file || !userId) {
      return new Response(
        JSON.stringify({ error: '文件和用户ID是必需的' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证文件类型
    if (!isValidImageType(file.type)) {
      return new Response(
        JSON.stringify({ error: '请选择有效的图片文件（JPG, PNG, GIF, WEBP）' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证文件大小
    if (!isValidFileSize(file.size, 2)) {
      return new Response(
        JSON.stringify({ error: '图片大小不能超过 2MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证用户是否存在
    const users = await select('users', { where: { id: userId } });
    if (users.length === 0) {
      return new Response(
        JSON.stringify({ error: '用户不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 获取旧头像 URL
    const oldAvatarUrl = users[0].avatar_url as string;

    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 Supabase Storage
    const uploadedUrl = await uploadAvatarServer(buffer, userId, file.name);

    if (!uploadedUrl) {
      return new Response(
        JSON.stringify({ error: '上传头像失败' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 更新数据库中的头像URL
    await update('users', { avatar_url: uploadedUrl }, { id: userId });

    // 删除旧头像（如果有）
    if (oldAvatarUrl) {
      await deleteAvatarServer(oldAvatarUrl);
    }

    return new Response(
      JSON.stringify({
        message: '头像上传成功',
        avatarUrl: uploadedUrl
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('上传头像时出错:', error);
    return new Response(
      JSON.stringify({ error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, avatarUrl } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: '未授权访问' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 获取当前头像URL，以便在更新后删除旧头像
    const users = await select('users', { where: { id: userId } });
    if (users.length === 0) {
      return new Response(
        JSON.stringify({ error: '用户不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const oldAvatarUrl = users[0].avatar_url as string;

    // 更新数据库中的头像URL
    const result = await update('users', { avatar_url: avatarUrl }, { id: userId });

    if (result) {
      // 如果有旧的头像，删除它
      if (oldAvatarUrl) {
        await deleteAvatarServer(oldAvatarUrl);
      }
      return new Response(
        JSON.stringify({
          message: '头像更新成功',
          avatarUrl: avatarUrl
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: '更新头像失败' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('更新头像时出错:', error);
    return new Response(
      JSON.stringify({ error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
