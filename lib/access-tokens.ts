// lib/access-tokens.ts
import select, { insert, update, remove } from './db';
import { getSupabaseClient } from './supabase';
import crypto from 'crypto';

export interface AccessToken {
  id?: number;
  name: string;
  token_hash: string;
  user_id: string;
  scope_gist: number; // 0: none, 1: read, 2: read+write
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
}

export interface CreateAccessTokenData {
  name: string;
  user_id: string;
  scope_gist: number;
  expires_at?: string;
}

// 生成随机令牌
export function generateToken(): string {
  const bytes = crypto.randomBytes(32);
  return 'og_' + bytes.toString('hex');
}

// 生成令牌的SHA-256哈希
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// 创建访问令牌
export async function createAccessToken(data: CreateAccessTokenData): Promise<{ token: AccessToken; plainToken: string }> {
  const plainToken = generateToken();
  const tokenHash = hashToken(plainToken);
  const now = new Date().toISOString();
  
  const tokenData = {
    name: data.name,
    token_hash: tokenHash,
    user_id: data.user_id,
    scope_gist: data.scope_gist,
    created_at: now,
    expires_at: data.expires_at || null,
  };
  
  const result = await insert('access_tokens', tokenData);
  
  return {
    token: {
      id: result && result[0] ? result[0].id : undefined,
      name: data.name,
      token_hash: tokenHash,
      user_id: data.user_id,
      scope_gist: data.scope_gist,
      created_at: now,
      expires_at: data.expires_at,
    },
    plainToken, // 这是唯一一次返回明文令牌
  };
}

// 通过哈希值获取访问令牌
export async function getAccessTokenByHash(tokenHash: string): Promise<AccessToken | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('access_tokens')
    .select(`
      id,
      name,
      token_hash,
      user_id,
      scope_gist,
      created_at,
      expires_at,
      last_used_at,
      users (
        id,
        name,
        email
      )
    `)
    .eq('token_hash', tokenHash)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id as number,
    name: data.name as string,
    token_hash: data.token_hash as string,
    user_id: data.user_id as string,
    scope_gist: data.scope_gist as number,
    created_at: data.created_at as string,
    expires_at: data.expires_at as string || undefined,
    last_used_at: data.last_used_at as string || undefined,
  };
}

// 通过明文令牌验证并获取访问令牌
export async function verifyAccessToken(plainToken: string): Promise<AccessToken | null> {
  const tokenHash = hashToken(plainToken);
  const token = await getAccessTokenByHash(tokenHash);
  
  if (!token) {
    return null;
  }
  
  // 检查是否过期
  if (token.expires_at && new Date(token.expires_at) < new Date()) {
    return null;
  }
  
  // 更新最后使用时间
  await updateLastUsed(token.id!);
  
  return token;
}

// 获取用户的所有访问令牌
export async function getAccessTokensByUserId(userId: string): Promise<AccessToken[]> {
  const tokens = await select('access_tokens', {
    where: { user_id: userId },
    order: 'created_at desc'
  });
  
  return tokens.map((t: any) => ({
    id: t.id as number,
    name: t.name as string,
    token_hash: t.token_hash as string,
    user_id: t.user_id as string,
    scope_gist: t.scope_gist as number,
    created_at: t.created_at as string,
    expires_at: t.expires_at as string || undefined,
    last_used_at: t.last_used_at as string || undefined,
  }));
}

// 更新最后使用时间
export async function updateLastUsed(tokenId: number): Promise<void> {
  const now = new Date().toISOString();
  await update('access_tokens', { last_used_at: now }, { id: tokenId });
}

// 删除访问令牌
export async function deleteAccessToken(tokenId: number, userId: string): Promise<boolean> {
  const result = await remove('access_tokens', { id: tokenId, user_id: userId });
  return result !== null && result.length > 0;
}

// 检查权限
export function hasGistReadPermission(token: AccessToken): boolean {
  return token.scope_gist >= 1;
}

export function hasGistWritePermission(token: AccessToken): boolean {
  return token.scope_gist >= 2;
}
