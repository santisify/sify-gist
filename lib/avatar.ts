import { getServerClient } from './supabase-server';

const AVATAR_BUCKET = 'avatars'; // 头像存储桶名称

/**
 * 上传头像到 Supabase Storage（服务端）
 * @param file 文件 Buffer 或 Blob
 * @param userId 用户ID，作为文件名的一部分
 * @param fileName 原始文件名（用于提取扩展名）
 * @returns 上传后的文件路径
 */
export async function uploadAvatarServer(
  file: Buffer | Blob,
  userId: string,
  fileName?: string
): Promise<string | null> {
  const supabase = getServerClient();

  // 生成唯一的文件名
  const originalExt = fileName?.split('.').pop()?.toLowerCase() || 'png';
  const fileExt = originalExt || 'png';
  const uniqueFileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

  try {
    const { data, error } = await supabase
      .storage
      .from(AVATAR_BUCKET)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: `image/${fileExt}`,
      });

    if (error) {
      console.error('上传头像失败:', error);
      throw error;
    }

    // 获取公开 URL
    const { data: publicUrlData } = supabase
      .storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(uniqueFileName);

    return publicUrlData?.publicUrl || null;
  } catch (error) {
    console.error('上传头像时出错:', error);
    throw error;
  }
}

/**
 * 删除旧头像（服务端）
 * @param filePath 要删除的文件路径
 */
export async function deleteAvatarServer(filePath: string): Promise<boolean> {
  const supabase = getServerClient();

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
 * 验证文件类型
 * @param mimeType 文件的 MIME 类型
 * @returns 是否为有效图片类型
 */
export function isValidImageType(mimeType: string): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(mimeType);
}

/**
 * 验证文件大小
 * @param size 文件大小（字节）
 * @param maxSizeMB 最大大小（MB），默认 2MB
 * @returns 是否在限制范围内
 */
export function isValidFileSize(size: number, maxSizeMB: number = 2): boolean {
  return size <= maxSizeMB * 1024 * 1024;
}
