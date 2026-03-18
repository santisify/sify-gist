// lib/gists.ts
import { nanoid } from 'nanoid';
import select, { getDb, insert, update, remove } from './db';

export interface File {
  id?: number;
  gist_id?: string;
  filename: string;
  content: string;
  language: string;
}

export interface Gist {
  id: string;
  user_id?: string;
  title?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  files: File[];
}

export interface GistVersion {
  id: number;
  gist_id: string;
  version_number: number;
  created_at: string;
  files: File[];
}

export interface CreateGistData {
  title?: string;
  description?: string;
  files: File[];
  user_id?: string;
}

export async function getAllGists(): Promise<Gist[]> {
  // 从 Supabase 获取所有 gists（限制为最新的50个）
  const gistsData = await select('gists', { 
    order: 'created_at desc', 
    limit: 50 
  });

  const gists: Gist[] = [];
  
  for (const gistData of gistsData) {
    // 获取该 gist 的所有文件
    const filesData = await select('gist_files', {
      where: { gist_id: gistData.id }
    });

    const files: File[] = filesData.map((fileData: any) => ({
      id: fileData.id,
      gist_id: fileData.gist_id,
      filename: fileData.filename,
      content: fileData.content,
      language: fileData.language
    }));

    gists.push({
      id: gistData.id as string,
      user_id: gistData.user_id as string,
      title: gistData.title as string,
      description: gistData.description as string,
      created_at: gistData.created_at as string,
      updated_at: gistData.updated_at as string,
      files: files
    });
  }

  return gists;
}

export async function getGistById(id: string): Promise<Gist | null> {
  const gistsData = await select('gists', {
    where: { id: id }
  });

  if (gistsData.length === 0) {
    return null;
  }

  const gistData = gistsData[0];
  
  // 获取该 gist 的所有文件
  const filesData = await select('gist_files', {
    where: { gist_id: id }
  });

  const files: File[] = filesData.map((fileData: any) => ({
    id: fileData.id,
    gist_id: fileData.gist_id,
    filename: fileData.filename,
    content: fileData.content,
    language: fileData.language
  }));

  return {
    id: gistData.id as string,
    user_id: gistData.user_id as string,
    title: gistData.title as string,
    description: gistData.description as string,
    created_at: gistData.created_at as string,
    updated_at: gistData.updated_at as string,
    files: files
  };
}

export async function createGist(data: CreateGistData): Promise<Gist> {
  const id = nanoid(12); // 生成唯一的 ID
  const now = new Date().toISOString();
  
  // 如果提供了 user_id，验证用户是否存在
  if (data.user_id) {
    const userResult = await select('users', {
      where: { id: data.user_id }
    });
    
    if (!userResult || userResult.length === 0) {
      throw new Error(`用户不存在: ${data.user_id}`);
    }
  }
  
  // 插入 gist
  await insert('gists', {
    id: id,
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    created_at: now,
    updated_at: now
  });

  // 插入文件
  for (const file of data.files) {
    await insert('gist_files', {
      gist_id: id,
      filename: file.filename,
      content: file.content,
      language: file.language
    });
  }

  // 创建初始版本记录
  await insert('gist_versions', {
    gist_id: id,
    version_number: 1 // 初始版本为1
  });

  // 返回创建的 gist
  return {
    id: id,
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    created_at: now,
    updated_at: now,
    files: data.files
  };
}

export async function updateGist(id: string, data: Partial<CreateGistData>): Promise<Gist | null> {
  const gist = await getGistById(id);
  
  if (!gist) {
    return null;
  }
  
  const now = new Date().toISOString();
  
  // 更新 gist 基本信息
  if (data.title !== undefined || data.description !== undefined) {
    await update('gists', {
      title: data.title,
      description: data.description,
      updated_at: now
    }, { id: id });
  }
  
  // 如果提供了新文件，替换现有文件并创建新版本
  if (data.files) {
    // 获取当前版本号
    const versions = await select('gist_versions', {
      where: { gist_id: id },
      order: 'version_number desc',
      limit: 1
    });
    
    const currentVersion = versions.length > 0 ? versions[0].version_number as number : 0;
    const newVersionNumber = currentVersion + 1;
    
    // 创建新版本记录
    const newVersion = await insert('gist_versions', {
      gist_id: id,
      version_number: newVersionNumber
    });
    
    if (newVersion) {
      // 保存当前文件到版本历史
      const currentFiles = await select('gist_files', {
        where: { gist_id: id }
      });
      
      for (const file of currentFiles) {
        await insert('gist_file_versions', {
          gist_version_id: newVersion[0].id,
          filename: file.filename,
          content: file.content,
          language: file.language
        });
      }
    }
    
    // 更新当前文件 - 先删除旧文件，再插入新文件
    await remove('gist_files', { gist_id: id });
    
    for (const file of data.files) {
      await insert('gist_files', {
        gist_id: id,
        filename: file.filename,
        content: file.content,
        language: file.language
      });
    }
  }
  
  // 获取更新后的 gist
  return await getGistById(id);
}

export async function deleteGist(id: string): Promise<boolean> {
  const result = await remove('gists', { id: id });
  return result !== null && result.length > 0;
}

export async function getGistsByUser(userId: string): Promise<Gist[]> {
  const gistsData = await select('gists', {
    where: { user_id: userId },
    order: 'created_at desc'
  });

  const gists: Gist[] = [];
  
  for (const gistData of gistsData) {
    // 获取该 gist 的所有文件
    const filesData = await select('gist_files', {
      where: { gist_id: gistData.id }
    });

    const files: File[] = filesData.map((fileData: any) => ({
      id: fileData.id,
      gist_id: fileData.gist_id,
      filename: fileData.filename,
      content: fileData.content,
      language: fileData.language
    }));

    gists.push({
      id: gistData.id as string,
      user_id: gistData.user_id as string,
      title: gistData.title as string,
      description: gistData.description as string,
      created_at: gistData.created_at as string,
      updated_at: gistData.updated_at as string,
      files: files
    });
  }

  return gists;
}

// 获取 gist 的所有版本
export async function getGistVersions(gistId: string): Promise<GistVersion[]> {
  const versionsData = await select('gist_versions', {
    where: { gist_id: gistId },
    order: 'version_number desc'
  });

  const versions: GistVersion[] = [];
  
  for (const versionData of versionsData) {
    // 获取该版本的文件
    const filesData = await select('gist_file_versions', {
      where: { gist_version_id: versionData.id }
    });

    const files: File[] = filesData.map((fileData: any) => ({
      filename: fileData.filename,
      content: fileData.content,
      language: fileData.language
    }));

    versions.push({
      id: versionData.id as number,
      gist_id: versionData.gist_id as string,
      version_number: versionData.version_number as number,
      created_at: versionData.created_at as string,
      files: files
    });
  }

  return versions;
}

// 获取特定版本的 gist
export async function getGistByVersion(gistId: string, versionNumber: number): Promise<Gist | null> {
  const gistsData = await select('gists', {
    where: { id: gistId }
  });

  if (gistsData.length === 0) {
    return null;
  }

  const gistData = gistsData[0];
  
  // 获取该版本的文件
  const versionData = await select('gist_versions', {
    where: { gist_id: gistId, version_number: versionNumber }
  });

  if (versionData.length === 0) {
    // 如果指定版本不存在，返回当前版本
    return await getGistById(gistId);
  }

  const filesData = await select('gist_file_versions', {
    where: { gist_version_id: versionData[0].id }
  });

  if (filesData.length === 0) {
    // 如果指定版本没有文件，返回当前版本
    return await getGistById(gistId);
  }

  const files: File[] = filesData.map((fileData: any) => ({
    filename: fileData.filename,
    content: fileData.content,
    language: fileData.language
  }));

  return {
    id: gistData.id as string,
    user_id: gistData.user_id as string,
    title: gistData.title as string,
    description: gistData.description as string,
    created_at: gistData.created_at as string,
    updated_at: gistData.updated_at as string,
    files: files
  };
}