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
  forked_from?: string;
  forked_from_gist?: Gist;
  stars_count?: number;
  forks_count?: number;
  topics?: string[];
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
  topics?: string[];
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

// 批量获取文件的辅助函数
async function batchGetFiles(gistIds: string[]): Promise<Map<string, File[]>> {
  if (gistIds.length === 0) return new Map();
  
  const supabase = getSupabaseClient();
  const { data: filesData, error } = await supabase
    .from('gist_files')
    .select('id, gist_id, filename, content, language')
    .in('gist_id', gistIds);
  
  if (error) {
    console.error('批量获取文件失败:', error);
    return new Map();
  }
  
  const filesMap = new Map<string, File[]>();
  for (const file of (filesData || [])) {
    const gistId = file.gist_id as string;
    if (!filesMap.has(gistId)) {
      filesMap.set(gistId, []);
    }
    filesMap.get(gistId)!.push({
      id: file.id,
      gist_id: file.gist_id,
      filename: file.filename,
      content: file.content,
      language: file.language,
    });
  }
  
  return filesMap;
}

// 批量获取标签的辅助函数
async function batchGetTopics(gistIds: string[]): Promise<Map<string, string[]>> {
  if (gistIds.length === 0) return new Map();
  
  const supabase = getSupabaseClient();
  const { data: topicsData, error } = await supabase
    .from('gist_topics')
    .select('gist_id, topic')
    .in('gist_id', gistIds);
  
  if (error) {
    console.error('批量获取标签失败:', error);
    return new Map();
  }
  
  const topicsMap = new Map<string, string[]>();
  for (const item of (topicsData || [])) {
    const gistId = item.gist_id as string;
    if (!topicsMap.has(gistId)) {
      topicsMap.set(gistId, []);
    }
    topicsMap.get(gistId)!.push(item.topic as string);
  }
  
  return topicsMap;
}

// 获取所有公开 Gists（带分页）- 优化版
export async function getAllGists(
  pagination: PaginationParams = { page: 1, limit: 10 },
  search?: SearchParams
): Promise<PaginatedResult<Gist>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  // 构建查询
  let query = supabase
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
    `, { count: 'exact' });

  // 可见性过滤
  if (search?.currentUserId) {
    query = query.or(`visibility.eq.public,user_id.eq.${search.currentUserId}`);
  } else {
    query = query.eq('visibility', 'public');
  }

  // 获取分页数据
  const { data: gistsData, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('获取 Gists 失败:', error);
    throw error;
  }

  const total = count || 0;
  const gistIds = (gistsData || []).map(g => g.id as string);
  
  // 批量获取文件和标签
  const [filesMap, topicsMap] = await Promise.all([
    batchGetFiles(gistIds),
    batchGetTopics(gistIds),
  ]);

  const gists: Gist[] = (gistsData || []).map(gistData => ({
    id: gistData.id as string,
    user_id: gistData.user_id as string,
    title: gistData.title as string,
    description: gistData.description as string,
    visibility: (gistData.visibility as Visibility) || 'public',
    topics: topicsMap.get(gistData.id as string) || [],
    created_at: gistData.created_at as string,
    updated_at: gistData.updated_at as string,
    files: filesMap.get(gistData.id as string) || [],
    user: gistData.users as any,
  }));

  return {
    data: gists,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// 搜索 Gists（带分页）- 优化版，完全在服务端进行
export async function searchGists(
  searchParams: SearchParams,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedResult<Gist>> {
  const { page, limit } = pagination;
  const { query: searchQuery, userId, currentUserId } = searchParams;
  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  // 第一步：获取所有匹配的 gist IDs（基于搜索词）
  let matchingGistIds: string[] | null = null;
  
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = searchQuery.toLowerCase().trim();
    
    // 搜索文件名和内容，获取匹配的 gist IDs
    const { data: matchingFiles, error: fileError } = await supabase
      .from('gist_files')
      .select('gist_id')
      .or(`filename.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
    
    if (fileError) {
      console.error('搜索文件失败:', fileError);
    }
    
    matchingGistIds = Array.from(new Set((matchingFiles || []).map(f => f.gist_id as string)));
  }

  // 第二步：构建主查询
  let baseQuery = supabase
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
    `);

  // 可见性过滤
  if (currentUserId) {
    baseQuery = baseQuery.or(`visibility.eq.public,user_id.eq.${currentUserId}`);
  } else {
    baseQuery = baseQuery.eq('visibility', 'public');
  }

  // 用户过滤
  if (userId) {
    baseQuery = baseQuery.eq('user_id', userId);
  }

  // 如果有搜索词匹配的 gist IDs，限制在这些 IDs 中
  if (matchingGistIds !== null) {
    if (matchingGistIds.length === 0) {
      // 没有匹配的文件，只搜索标题和描述
      const searchTerm = searchQuery!.toLowerCase().trim();
      baseQuery = baseQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    } else {
      // 合并文件匹配和标题/描述匹配
      const searchTerm = searchQuery!.toLowerCase().trim();
      // 使用 in 查询匹配的 gist IDs，或者标题/描述匹配
      // Supabase 不支持复杂的 OR 组合，所以先获取所有可能的候选
      baseQuery = baseQuery.in('id', matchingGistIds);
    }
  }

  // 先获取总数
  const { data: allMatches, error: countError } = await baseQuery;
  
  if (countError) {
    console.error('搜索 Gists 失败:', countError);
    throw countError;
  }

  // 如果有搜索词，还需要在标题/描述中搜索并合并结果
  let finalMatches = allMatches || [];
  
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = searchQuery.toLowerCase().trim();
    
    // 添加标题和描述匹配的结果
    const titleDescQuery = supabase
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
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    
    // 应用可见性过滤
    if (currentUserId) {
      // @ts-ignore
      titleDescQuery.or(`visibility.eq.public,user_id.eq.${currentUserId}`);
    } else {
      // @ts-ignore
      titleDescQuery.eq('visibility', 'public');
    }
    
    // 应用用户过滤
    if (userId) {
      // @ts-ignore
      titleDescQuery.eq('user_id', userId);
    }
    
    const { data: titleDescMatches } = await titleDescQuery;
    
    // 合并结果（去重）
    const existingIds = new Set(finalMatches.map(g => g.id));
    for (const match of (titleDescMatches || [])) {
      if (!existingIds.has(match.id)) {
        finalMatches.push(match);
        existingIds.add(match.id);
      }
    }
  }

  // 排序
  finalMatches.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const total = finalMatches.length;
  const paginatedMatches = finalMatches.slice(offset, offset + limit);
  const gistIds = paginatedMatches.map(g => g.id as string);

  // 批量获取文件和标签
  const [filesMap, topicsMap] = await Promise.all([
    batchGetFiles(gistIds),
    batchGetTopics(gistIds),
  ]);

  const gists: Gist[] = paginatedMatches.map(gistData => ({
    id: gistData.id as string,
    user_id: gistData.user_id as string,
    title: gistData.title as string,
    description: gistData.description as string,
    visibility: (gistData.visibility as Visibility) || 'public',
    topics: topicsMap.get(gistData.id as string) || [],
    created_at: gistData.created_at as string,
    updated_at: gistData.updated_at as string,
    files: filesMap.get(gistData.id as string) || [],
    user: gistData.users as any,
  }));

  return {
    data: gists,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
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
  const id = nanoid(12);
  const now = new Date().toISOString();
  const visibility = data.visibility || 'public';
  
  if (data.user_id) {
    const userResult = await select('users', {
      where: { id: data.user_id }
    });
    
    if (!userResult || userResult.length === 0) {
      throw new Error(`用户不存在: ${data.user_id}`);
    }
  }
  
  await insert('gists', {
    id: id,
    user_id: data.user_id,
    title: data.title,
    description: data.description,
    visibility: visibility,
    created_at: now,
    updated_at: now
  });

  for (const file of data.files) {
    await insert('gist_files', {
      gist_id: id,
      filename: file.filename,
      content: file.content,
      language: file.language
    });
  }

  const initialVersion = await insert('gist_versions', {
    gist_id: id,
    version_number: 1
  });

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

  if (data.topics && data.topics.length > 0) {
    await setGistTopics(id, data.topics);
  }

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
  
  if (data.title !== undefined || data.description !== undefined || data.visibility !== undefined) {
    await update('gists', {
      title: data.title,
      description: data.description,
      visibility: data.visibility,
      updated_at: now
    }, { id: id });
  }
  
  if (data.files) {
    const versions = await select('gist_versions', {
      where: { gist_id: id },
      order: 'version_number desc',
      limit: 1
    });
    
    const currentVersionNumber = versions.length > 0 ? versions[0].version_number as number : 0;
    const newVersionNumber = currentVersionNumber + 1;
    
    const newVersion = await insert('gist_versions', {
      gist_id: id,
      version_number: newVersionNumber
    });
    
    await remove('gist_files', { gist_id: id });
    
    for (const file of data.files) {
      await insert('gist_files', {
        gist_id: id,
        filename: file.filename,
        content: file.content,
        language: file.language
      });
    }
    
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
  
  return await getGistById(id);
}

export async function deleteGist(id: string): Promise<boolean> {
  const result = await remove('gists', { id: id });
  return result !== null && result.length > 0;
}

// 获取用户的 Gists - 优化版
export async function getGistsByUser(
  userId: string,
  currentUserId?: string,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedResult<Gist>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  let query = supabase
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
    .eq('user_id', userId);

  // 如果不是自己的 profile，只显示公开的
  if (currentUserId !== userId) {
    query = query.eq('visibility', 'public');
  }

  const { data: gistsData, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('获取用户 Gists 失败:', error);
    throw error;
  }

  const total = count || 0;
  const gistIds = (gistsData || []).map(g => g.id as string);
  
  // 批量获取文件和标签
  const [filesMap, topicsMap] = await Promise.all([
    batchGetFiles(gistIds),
    batchGetTopics(gistIds),
  ]);

  const gists: Gist[] = (gistsData || []).map(gistData => ({
    id: gistData.id as string,
    user_id: gistData.user_id as string,
    title: gistData.title as string,
    description: gistData.description as string,
    visibility: (gistData.visibility as Visibility) || 'public',
    topics: topicsMap.get(gistData.id as string) || [],
    created_at: gistData.created_at as string,
    updated_at: gistData.updated_at as string,
    files: filesMap.get(gistData.id as string) || [],
    user: gistData.users as any,
  }));

  return {
    data: gists,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// 获取 gist 的所有版本
export async function getGistVersions(gistId: string): Promise<GistVersion[]> {
  const versionsData = await select('gist_versions', {
    where: { gist_id: gistId },
    order: 'version_number desc'
  });

  if (versionsData.length === 0) {
    return [];
  }

  // 批量获取所有版本的文件
  const versionIds = versionsData.map(v => v.id as number);
  const supabase = getSupabaseClient();
  
  const { data: filesData, error } = await supabase
    .from('gist_file_versions')
    .select('gist_version_id, filename, content, language')
    .in('gist_version_id', versionIds);
  
  if (error) {
    console.error('获取版本文件失败:', error);
  }
  
  // 按版本 ID 分组
  const filesByVersion = new Map<number, File[]>();
  for (const file of (filesData || [])) {
    const versionId = file.gist_version_id as number;
    if (!filesByVersion.has(versionId)) {
      filesByVersion.set(versionId, []);
    }
    filesByVersion.get(versionId)!.push({
      filename: file.filename,
      content: file.content,
      language: file.language,
    });
  }

  return versionsData.map(versionData => ({
    id: versionData.id as number,
    gist_id: versionData.gist_id as string,
    version_number: versionData.version_number as number,
    created_at: versionData.created_at as string,
    files: filesByVersion.get(versionData.id as number) || [],
  }));
}

// 获取特定版本的 gist
export async function getGistByVersion(gistId: string, versionNumber: number): Promise<Gist | null> {
  const gist = await getGistById(gistId);

  if (!gist) {
    return null;
  }
  
  const versionsData = await select('gist_versions', {
    where: { gist_id: gistId },
    order: 'version_number desc',
    limit: 1
  });
  
  const latestVersionNumber = versionsData.length > 0 ? versionsData[0].version_number as number : 1;
  
  if (versionNumber >= latestVersionNumber) {
    return gist;
  }
  
  const versionData = await select('gist_versions', {
    where: { gist_id: gistId, version_number: versionNumber }
  });

  if (versionData.length === 0) {
    return null;
  }

  const filesData = await select('gist_file_versions', {
    where: { gist_version_id: versionData[0].id }
  });

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
  
  return {
    ...gist,
    created_at: versionData[0].created_at as string,
    files: []
  };
}

// Fork 一个 Gist
export async function forkGist(gistId: string, userId: string): Promise<Gist> {
  const originalGist = await getGistById(gistId);
  
  if (!originalGist) {
    throw new Error('Gist 不存在');
  }
  
  const existingForks = await select('gists', {
    where: { forked_from: gistId, user_id: userId }
  });
  
  if (existingForks.length > 0) {
    throw new Error('您已经 fork 过这个 Gist');
  }
  
  const forkedGist = await createGist({
    title: originalGist.title,
    description: originalGist.description,
    visibility: originalGist.visibility,
    files: originalGist.files,
    user_id: userId
  });
  
  await update('gists', { forked_from: gistId }, { id: forkedGist.id });
  
  const currentForksCount = (originalGist.forks_count || 0) + 1;
  await update('gists', { forks_count: currentForksCount }, { id: gistId });
  
  const originalTopics = await getGistTopics(gistId);
  if (originalTopics.length > 0) {
    await setGistTopics(forkedGist.id, originalTopics);
  }
  
  return {
    ...forkedGist,
    forked_from: gistId
  };
}

// 获取 Gist 的 Fork 列表 - 优化版
export async function getGistForks(
  gistId: string,
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedResult<Gist>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  const { count } = await supabase
    .from('gists')
    .select('*', { count: 'exact', head: true })
    .eq('forked_from', gistId);
  
  const total = count || 0;

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

  const forkIds = (forksData || []).map(f => f.id as string);
  
  // 批量获取文件
  const filesMap = await batchGetFiles(forkIds);

  const forks: Gist[] = (forksData || []).map(forkData => ({
    id: forkData.id as string,
    user_id: forkData.user_id as string,
    title: forkData.title as string,
    description: forkData.description as string,
    visibility: (forkData.visibility as Visibility) || 'public',
    forked_from: forkData.forked_from as string,
    created_at: forkData.created_at as string,
    updated_at: forkData.updated_at as string,
    files: filesMap.get(forkData.id as string) || [],
    user: forkData.users as any,
  }));

  return {
    data: forks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
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
  
  await supabase
    .from('gist_topics')
    .delete()
    .eq('gist_id', gistId);
  
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

// 按标签搜索 Gists - 优化版
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

  const { count } = await supabase
    .from('gists')
    .select('*', { count: 'exact', head: true })
    .in('id', gistIds)
    .eq('visibility', 'public');
  
  const total = count || 0;

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

  const resultGistIds = (gistsData || []).map(g => g.id as string);
  
  // 批量获取文件
  const filesMap = await batchGetFiles(resultGistIds);

  const gists: Gist[] = (gistsData || []).map(gistData => ({
    id: gistData.id as string,
    user_id: gistData.user_id as string,
    title: gistData.title as string,
    description: gistData.description as string,
    visibility: (gistData.visibility as Visibility) || 'public',
    topics: [topic.toLowerCase().trim()],
    created_at: gistData.created_at as string,
    updated_at: gistData.updated_at as string,
    files: filesMap.get(gistData.id as string) || [],
    user: gistData.users as any,
  }));

  return {
    data: gists,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
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
  
  const topicCounts = new Map<string, number>();
  for (const item of data) {
    const topic = item.topic as string;
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  }
  
  return Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
