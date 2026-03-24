// lib/gists.ts
import { nanoid } from 'nanoid';
import select, { insert, update, remove } from './db';
import { getSupabaseClient } from './supabase';

export interface File {
  id?: number;
  gist_id?: string;
  filename: string;
  content: string;
  language: string;
}

export type Visibility = 'public' | 'unlisted' | 'private';

export interface Gist {
  id: string;
  user_id?: string;
  title?: string;
  description?: string;
  visibility: Visibility;
  forked_from?: string;  // Fork 来源 gist ID
  forked_from_gist?: Gist;  // Fork 来源 gist 信息
  stars_count?: number;
  forks_count?: number;
  topics?: string[];  // 标签列表
  created_at: string;
  updated_at: string;
  files: File[];
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
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
  visibility?: Visibility;
  files: File[];
  user_id?: string;
  topics?: string[];  // 标签列表
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchParams {
  query?: string;
  userId?: string;
  visibility?: Visibility[];
  currentUserId?: string;
}

// 获取所有公开 Gists（带分页）
export async function getAllGists(
  pagination: PaginationParams = { page: 1, limit: 10 },
  search?: SearchParams
): Promise<PaginatedResult<Gist>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  // 获取总数
  const { count, error: countError } = await supabase
    .from('gists')
    .select('*', { count: 'exact', head: true })
    .eq('visibility', 'public');
  
  if (countError) {
    console.error('获取 Gist 总数失败:', countError);
    throw countError;
  }
  
  const total = count || 0;

  // 获取分页数据
  const { data: gistsData, error } = await supabase
    .from('gists')
    .select(`
      id,
      user_id,
      title,
      description,
      visibility,
      created_at,
      updated_at,
      users!gists_user_id_fkey (
        id,
        name,
        avatar_url
      )
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('获取 Gists 失败:', error);
    throw error;
  }

  const gists: Gist[] = [];
  
  for (const gistData of (gistsData || [])) {
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
      visibility: (gistData.visibility as Visibility) || 'public',
      created_at: gistData.created_at as string,
      updated_at: gistData.updated_at as string,
      files: files,
      user: gistData.users as any
    });
  }

  return {
    data: gists,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

// 搜索 Gists（带分页）
export async function searchGists(
  searchParams: SearchParams,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedResult<Gist>> {
  const { page, limit } = pagination;
  const { query, userId, currentUserId } = searchParams;
  const offset = (page - 1) * limit;

  const supabase = getSupabaseClient();

  // 构建基础查询
  let baseQuery = supabase.from('gists').select(`
    id,
    user_id,
    title,
    description,
    visibility,
    created_at,
    updated_at,
    users!gists_user_id_fkey (
      id,
      name,
      avatar_url
    )
  `);

  // 可见性过滤
  if (currentUserId) {
    // 登录用户可以看到：public + 自己的所有 gist
    baseQuery = baseQuery.or(`visibility.eq.public,user_id.eq.${currentUserId}`);
  } else {
    // 未登录用户只能看到 public
    baseQuery = baseQuery.eq('visibility', 'public');
  }

  // 用户过滤
  if (userId) {
    baseQuery = baseQuery.eq('user_id', userId);
  }

  // 执行查询获取所有匹配的 gists（用于计算总数和客户端搜索）
  const { data: allGists, error } = await baseQuery.order('created_at', { ascending: false });

  if (error) {
    console.error('搜索 Gists 失败:', error);
    throw error;
  }

  // 如果有搜索词，进行客户端过滤（因为需要搜索文件内容和文件名）
  let filteredGists = allGists || [];
  
  if (query && query.trim()) {
    const searchTerm = query.toLowerCase().trim();
    
    // 获取所有匹配的 gist IDs
    const matchingGistIds = new Set<string>();
    
    // 搜索标题和描述
    for (const gist of filteredGists) {
      const titleMatch = gist.title?.toLowerCase().includes(searchTerm);
      const descMatch = gist.description?.toLowerCase().includes(searchTerm);
      
      if (titleMatch || descMatch) {
        matchingGistIds.add(gist.id);
      }
    }
    
    // 搜索文件名和内容
    const { data: matchingFiles, error: fileError } = await supabase
      .from('gist_files')
      .select('gist_id, filename, content')
      .or(`filename.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
    
    if (!fileError && matchingFiles) {
      for (const file of matchingFiles) {
        matchingGistIds.add(file.gist_id);
      }
    }
    
    // 过滤结果
    filteredGists = filteredGists.filter((g: any) => matchingGistIds.has(g.id));
  }

  const total = filteredGists.length;
  const paginatedGists = filteredGists.slice(offset, offset + limit);

  // 获取文件数据
  const gists: Gist[] = [];
  
  for (const gistData of paginatedGists) {
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
      visibility: (gistData.visibility as Visibility) || 'public',
      created_at: gistData.created_at as string,
      updated_at: gistData.updated_at as string,
      files: files,
      user: gistData.users as any
    });
  }

  return {
    data: gists,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getGistById(id: string): Promise<Gist | null> {
  const supabase = getSupabaseClient();
  
  const { data: gistData, error } = await supabase
    .from('gists')
    .select(`
      id,
      user_id,
      title,
      description,
      visibility,
      forked_from,
      stars_count,
      forks_count,
      created_at,
      updated_at,
      users!gists_user_id_fkey (
        id,
        name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error || !gistData) {
    return null;
  }

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

  // 获取标签
  const topics = await getGistTopics(id);

  return {
    id: gistData.id as string,
    user_id: gistData.user_id as string,
    title: gistData.title as string,
    description: gistData.description as string,
    visibility: (gistData.visibility as Visibility) || 'public',
    forked_from: gistData.forked_from as string | undefined,
    stars_count: (gistData.stars_count as number) || 0,
    forks_count: (gistData.forks_count as number) || 0,
    topics: topics,
    created_at: gistData.created_at as string,
    updated_at: gistData.updated_at as string,
    files: files,
    user: gistData.users as any
  };
}

export async function createGist(data: CreateGistData): Promise<Gist> {
  const id = nanoid(12); // 生成唯一的 ID
  const now = new Date().toISOString();
  const visibility = data.visibility || 'public';
  
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
    visibility: visibility,
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
  const initialVersion = await insert('gist_versions', {
    gist_id: id,
    version_number: 1 // 初始版本为1
  });

  // 保存初始版本的文件内容
  if (initialVersion && initialVersion[0]) {
    for (const file of data.files) {
      await insert('gist_file_versions', {
        gist_version_id: initialVersion[0].id,
        filename: file.filename,
        content: file.content,
        language: file.language
      });
    }
  }

  // 添加标签
  if (data.topics && data.topics.length > 0) {
    await setGistTopics(id, data.topics);
  }

  // 返回创建的 gist
  return {
    id: id,
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    visibility: visibility,
    topics: data.topics || [],
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
  if (data.title !== undefined || data.description !== undefined || data.visibility !== undefined) {
    await update('gists', {
      title: data.title,
      description: data.description,
      visibility: data.visibility,
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
    
    const currentVersionNumber = versions.length > 0 ? versions[0].version_number as number : 0;
    const newVersionNumber = currentVersionNumber + 1;
    
    // 创建新版本记录
    const newVersion = await insert('gist_versions', {
      gist_id: id,
      version_number: newVersionNumber
    });
    
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
    
    // 保存新版本的文件内容到历史记录
    if (newVersion && newVersion[0]) {
      for (const file of data.files) {
        await insert('gist_file_versions', {
          gist_version_id: newVersion[0].id,
          filename: file.filename,
          content: file.content,
          language: file.language
        });
      }
    }
  }
  
  // 获取更新后的 gist
  return await getGistById(id);
}

export async function deleteGist(id: string): Promise<boolean> {
  const result = await remove('gists', { id: id });
  return result !== null && result.length > 0;
}

export async function getGistsByUser(
  userId: string,
  currentUserId?: string,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedResult<Gist>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  // 构建查询
  const { data: gistsData, count, error } = await supabase
    .from('gists')
    .select(`
      id,
      user_id,
      title,
      description,
      visibility,
      created_at,
      updated_at,
      users!gists_user_id_fkey (
        id,
        name,
        avatar_url
      )
    `, { count: 'exact' })
    .eq('user_id', userId)
    // 如果不是自己的 profile，只显示公开的
    .eq(currentUserId !== userId ? 'visibility' : '', 'public')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('获取用户 Gists 失败:', error);
    throw error;
  }

  const total = count || 0;
  const gists: Gist[] = [];
  
  for (const gistData of (gistsData || [])) {
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
      visibility: (gistData.visibility as Visibility) || 'public',
      created_at: gistData.created_at as string,
      updated_at: gistData.updated_at as string,
      files: files,
      user: gistData.users as any
    });
  }

  return {
    data: gists,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
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
  const gist = await getGistById(gistId);

  if (!gist) {
    return null;
  }
  
  // 获取所有版本，找到最新版本号
  const versionsData = await select('gist_versions', {
    where: { gist_id: gistId },
    order: 'version_number desc',
    limit: 1
  });
  
  const latestVersionNumber = versionsData.length > 0 ? versionsData[0].version_number as number : 1;
  
  // 如果请求的是最新版本，从 gist_files 获取（当前版本）
  if (versionNumber >= latestVersionNumber) {
    return gist;
  }
  
  // 获取指定版本的元数据
  const versionData = await select('gist_versions', {
    where: { gist_id: gistId, version_number: versionNumber }
  });

  if (versionData.length === 0) {
    return null;
  }

  // 从 gist_file_versions 获取历史版本文件
  const filesData = await select('gist_file_versions', {
    where: { gist_version_id: versionData[0].id }
  });

  // 如果历史版本有文件内容，返回它
  if (filesData.length > 0) {
    const files: File[] = filesData.map((fileData: any) => ({
      filename: fileData.filename,
      content: fileData.content,
      language: fileData.language
    }));

    return {
      ...gist,
      created_at: versionData[0].created_at as string,
      files: files
    };
  }
  
  // 历史版本没有文件内容（旧数据缺失）
  return {
    ...gist,
    created_at: versionData[0].created_at as string,
    files: []
  };
}

// Fork 一个 Gist
export async function forkGist(gistId: string, userId: string): Promise<Gist> {
  // 获取原始 Gist
  const originalGist = await getGistById(gistId);
  
  if (!originalGist) {
    throw new Error('Gist 不存在');
  }
  
  // 检查是否已经 fork 过
  const existingForks = await select('gists', {
    where: { forked_from: gistId, user_id: userId }
  });
  
  if (existingForks.length > 0) {
    throw new Error('您已经 fork 过这个 Gist');
  }
  
  // 创建新的 Gist（复制内容）
  const forkedGist = await createGist({
    title: originalGist.title,
    description: originalGist.description,
    visibility: originalGist.visibility,
    files: originalGist.files,
    user_id: userId
  });
  
  // 更新 forked_from 字段
  await update('gists', { forked_from: gistId }, { id: forkedGist.id });
  
  // 更新原始 Gist 的 forks_count
  const currentForksCount = (originalGist.forks_count || 0) + 1;
  await update('gists', { forks_count: currentForksCount }, { id: gistId });
  
  // 复制原始 Gist 的标签
  const originalTopics = await getGistTopics(gistId);
  if (originalTopics.length > 0) {
    await setGistTopics(forkedGist.id, originalTopics);
  }
  
  return {
    ...forkedGist,
    forked_from: gistId
  };
}

// 获取 Gist 的 Fork 列表
export async function getGistForks(
  gistId: string,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedResult<Gist>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  // 获取总数
  const { count } = await supabase
    .from('gists')
    .select('*', { count: 'exact', head: true })
    .eq('forked_from', gistId);
  
  const total = count || 0;

  // 获取分页数据
  const { data: forksData, error } = await supabase
    .from('gists')
    .select(`
      id,
      user_id,
      title,
      description,
      visibility,
      forked_from,
      created_at,
      updated_at,
      users!gists_user_id_fkey (
        id,
        name,
        avatar_url
      )
    `)
    .eq('forked_from', gistId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('获取 Fork 列表失败:', error);
    throw error;
  }

  const forks: Gist[] = [];
  
  for (const forkData of (forksData || [])) {
    const filesData = await select('gist_files', {
      where: { gist_id: forkData.id }
    });

    const files: File[] = filesData.map((fileData: any) => ({
      id: fileData.id,
      gist_id: fileData.gist_id,
      filename: fileData.filename,
      content: fileData.content,
      language: fileData.language
    }));

    forks.push({
      id: forkData.id as string,
      user_id: forkData.user_id as string,
      title: forkData.title as string,
      description: forkData.description as string,
      visibility: (forkData.visibility as Visibility) || 'public',
      forked_from: forkData.forked_from as string,
      created_at: forkData.created_at as string,
      updated_at: forkData.updated_at as string,
      files: files,
      user: forkData.users as any
    });
  }

  return {
    data: forks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

// 检查用户是否已 fork 过某个 Gist
export async function hasUserForked(gistId: string, userId: string): Promise<string | null> {
  const forks = await select('gists', {
    where: { forked_from: gistId, user_id: userId }
  });
  
  return forks.length > 0 ? forks[0].id as string : null;
}

// 获取 Gist 的标签
export async function getGistTopics(gistId: string): Promise<string[]> {
  const topicsData = await select('gist_topics', {
    where: { gist_id: gistId }
  });
  
  return topicsData.map((t: any) => t.topic as string);
}

// 设置 Gist 的标签（替换现有标签）
export async function setGistTopics(gistId: string, topics: string[]): Promise<void> {
  const supabase = getSupabaseClient();
  
  // 删除现有标签
  await supabase
    .from('gist_topics')
    .delete()
    .eq('gist_id', gistId);
  
  // 添加新标签
  if (topics.length > 0) {
    const topicRows = topics.map(topic => ({
      gist_id: gistId,
      topic: topic.toLowerCase().trim()
    }));
    
    await supabase
      .from('gist_topics')
      .insert(topicRows);
  }
}

// 按标签搜索 Gists
export async function getGistsByTopic(
  topic: string,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedResult<Gist>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  // 获取包含该标签的 gist IDs
  const { data: topicData } = await supabase
    .from('gist_topics')
    .select('gist_id')
    .eq('topic', topic.toLowerCase().trim());
  
  const gistIds = (topicData || []).map(t => t.gist_id);
  
  if (gistIds.length === 0) {
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  // 获取总数
  const { count } = await supabase
    .from('gists')
    .select('*', { count: 'exact', head: true })
    .in('id', gistIds)
    .eq('visibility', 'public');
  
  const total = count || 0;

  // 获取分页数据
  const { data: gistsData, error } = await supabase
    .from('gists')
    .select(`
      id,
      user_id,
      title,
      description,
      visibility,
      created_at,
      updated_at,
      users!gists_user_id_fkey (
        id,
        name,
        avatar_url
      )
    `)
    .in('id', gistIds)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('获取标签 Gists 失败:', error);
    throw error;
  }

  const gists: Gist[] = [];
  
  for (const gistData of (gistsData || [])) {
    const filesData = await select('gist_files', {
      where: { gist_id: gistData.id }
    });

    const topics = await getGistTopics(gistData.id);

    gists.push({
      id: gistData.id as string,
      user_id: gistData.user_id as string,
      title: gistData.title as string,
      description: gistData.description as string,
      visibility: (gistData.visibility as Visibility) || 'public',
      topics: topics,
      created_at: gistData.created_at as string,
      updated_at: gistData.updated_at as string,
      files: filesData.map((f: any) => ({
        id: f.id,
        gist_id: f.gist_id,
        filename: f.filename,
        content: f.content,
        language: f.language
      })),
      user: gistData.users as any
    });
  }

  return {
    data: gists,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

// 获取热门标签
export async function getPopularTopics(limit: number = 20): Promise<{ topic: string; count: number }[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('gist_topics')
    .select('topic');
  
  if (error || !data) {
    return [];
  }
  
  // 统计每个标签的出现次数
  const topicCounts = new Map<string, number>();
  for (const item of data) {
    const topic = item.topic as string;
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  }
  
  // 排序并返回前 N 个
  return Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}