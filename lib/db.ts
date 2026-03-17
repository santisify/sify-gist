// lib/db.ts
import { getSupabaseClient } from './supabase';
import { Gist, File } from './gists';

// 检查是否在服务器端
function isServer() {
  return typeof window === 'undefined';
}

// 从 Supabase 获取数据的通用函数
export async function getDb() {
  if (!isServer()) {
    // 在客户端，抛出错误，因为数据库操作只能在服务器端执行
    throw new Error('数据库操作只能在服务器端执行');
  }

  return getSupabaseClient();
}

// Supabase 数据库初始化 - 在实际应用中，这些表需要在 Supabase 仪表板中创建
let isInitialized = false;

export async function initDb() {
  if (isInitialized) {
    return;
  }

  // 只在服务器端初始化数据库
  if (!isServer()) {
    throw new Error('数据库初始化只能在服务器端执行');
  }

  try {
    const supabase = getSupabaseClient();
    
    console.log('数据库连接成功，使用 Supabase');
    isInitialized = true;
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 以下是一些辅助函数，用于将现有数据库操作映射到 Supabase
export async function insert<T = any>(table: string, data: any): Promise<T[] | null> {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from(table)
    .insert(data);

  if (error) {
    console.error(`插入 ${table} 表失败:`, error);
    throw error;
  }

  return result;
}

export async function select<T = any>(table: string, options?: { where?: any; order?: string; limit?: number }): Promise<T[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from(table).select();

  if (options?.where) {
    for (const [key, value] of Object.entries(options.where)) {
      query = query.eq(key, value);
    }
  }

  if (options?.order) {
    const [column, ascendingStr] = options.order.split(' ');
    const ascending = ascendingStr?.toLowerCase() !== 'desc';
    query = query.order(column, { ascending });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`查询 ${table} 表失败:`, error);
    throw error;
  }

  return data || [];
}

export async function update<T = any>(table: string, data: any, where: any): Promise<T[] | null> {
  const supabase = getSupabaseClient();
  let query = supabase.from(table).update(data);

  for (const [key, value] of Object.entries(where)) {
    query = query.eq(key, value);
  }

  const { data: result, error } = await query;

  if (error) {
    console.error(`更新 ${table} 表失败:`, error);
    throw error;
  }

  return result;
}

export async function remove<T = any>(table: string, where: any): Promise<T[] | null> {
  const supabase = getSupabaseClient();
  let query = supabase.from(table).delete();

  for (const [key, value] of Object.entries(where)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`删除 ${table} 表失败:`, error);
    throw error;
  }

  return data;
}