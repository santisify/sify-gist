import supabaseAuthWrapper from './supabase-auth-wrapper';

const AVATAR_BUCKET = 'avatars'; // 头像存储桶名称

/**
 * 上传头像到 Supabase Storage
 * @param file 要上传的文件
 * @param userId 用户ID，作为文件名的一部分
 * @returns 上传后的文件路径
 */
export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const supabase = supabaseAuthWrapper.getClient();

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件');
  }

  // 限制文件大小 (最大 2MB)
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('图片大小不能超过 2MB');
  }

  // 生成唯一的文件名
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  
  try {
    const { data, error } = await supabase
      .storage
      .from(AVATAR_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // 如果文件已存在则覆盖
      });

    if (error) {
      console.error('上传头像失败:', error);
      throw error;
    }

    // 获取公开 URL
    const { data: publicUrlData } = supabase
      .storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl || null;
  } catch (error) {
    console.error('上传头像时出错:', error);
    throw error;
  }
}

/**
 * 删除旧头像
 * @param filePath 要删除的文件路径
 */
export async function deleteAvatar(filePath: string): Promise<boolean> {
  const supabase = supabaseAuthWrapper.getClient();

  try {
    // 从 URL 中提取文件路径部分
    // URL 格式: https://[project_ref].supabase.co/storage/v1/object/avatars/[userId]/[filename]
    const url = new URL(filePath);
    const pathParts = url.pathname.split('/object/')[1]; // 获取 object 后面的部分
    
    if (!pathParts) return false;
    
    const fullFilePath = pathParts.split('/').slice(1).join('/'); // 移除桶名并重建路径

    const { error } = await supabase
      .storage
      .from(AVATAR_BUCKET)
      .remove([fullFilePath]);

    if (error) {
      console.error('删除头像失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('删除头像时出错:', error);
    return false;
  }
}

/**
 * 获取头像的公开 URL
 * @param fileName 文件名
 * @returns 公开 URL
 */
export async function getAvatarUrl(fileName: string): Promise<string | null> {
  const supabase = supabaseAuthWrapper.getClient();

  try {
    const { data } = supabase
      .storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(fileName);

    return data?.publicUrl || null;
  } catch (error) {
    console.error('获取头像 URL 失败:', error);
    return null;
  }
}