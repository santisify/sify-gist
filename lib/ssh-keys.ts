// lib/ssh-keys.ts
import select, { insert, update, remove } from './db';
import { getSupabaseClient } from './supabase';
import crypto from 'crypto';

export interface SSHKey {
  id?: number;
  title: string;
  content: string;
  sha: string;
  user_id: string;
  created_at: string;
  last_used_at?: string;
}

export interface CreateSSHKeyData {
  title: string;
  content: string;
  user_id: string;
}

// 从SSH公钥内容生成SHA-256指纹
export function generateSHA(content: string): string {
  // 移除多余的空白字符
  const trimmedContent = content.trim();
  // 简单地生成SHA-256哈希
  return crypto.createHash('sha256').update(trimmedContent).digest('base64');
}

// 创建SSH密钥
export async function createSSHKey(data: CreateSSHKeyData): Promise<SSHKey> {
  const sha = generateSHA(data.content);
  const now = new Date().toISOString();
  
  const keyData = {
    title: data.title,
    content: data.content.trim(),
    sha: sha,
    user_id: data.user_id,
    created_at: now,
  };
  
  const result = await insert('ssh_keys', keyData);
  
  return {
    id: result && result[0] ? result[0].id : undefined,
    title: data.title,
    content: data.content.trim(),
    sha: sha,
    user_id: data.user_id,
    created_at: now,
  };
}

// 获取用户的所有SSH密钥
export async function getSSHKeysByUserId(userId: string): Promise<SSHKey[]> {
  const keys = await select('ssh_keys', {
    where: { user_id: userId },
    order: 'created_at asc'
  });
  
  return keys.map((k: any) => ({
    id: k.id as number,
    title: k.title as string,
    content: k.content as string,
    sha: k.sha as string,
    user_id: k.user_id as string,
    created_at: k.created_at as string,
    last_used_at: k.last_used_at as string || undefined,
  }));
}

// 通过ID获取SSH密钥
export async function getSSHKeyById(keyId: number): Promise<SSHKey | null> {
  const keys = await select('ssh_keys', {
    where: { id: keyId }
  });
  
  if (keys.length === 0) {
    return null;
  }
  
  const key = keys[0];
  return {
    id: key.id as number,
    title: key.title as string,
    content: key.content as string,
    sha: key.sha as string,
    user_id: key.user_id as string,
    created_at: key.created_at as string,
    last_used_at: key.last_used_at as string || undefined,
  };
}

// 检查SSH密钥是否已存在
export async function sshKeyExists(content: string): Promise<boolean> {
  const sha = generateSHA(content);
  const keys = await select('ssh_keys', {
    where: { sha: sha }
  });
  
  return keys.length > 0;
}

// 检查SSH密钥是否属于用户
export async function sshKeyExistsForUser(content: string, userId: string): Promise<SSHKey | null> {
  const sha = generateSHA(content);
  const keys = await select('ssh_keys', {
    where: { sha: sha, user_id: userId }
  });
  
  if (keys.length === 0) {
    return null;
  }
  
  const key = keys[0];
  return {
    id: key.id as number,
    title: key.title as string,
    content: key.content as string,
    sha: key.sha as string,
    user_id: key.user_id as string,
    created_at: key.created_at as string,
    last_used_at: key.last_used_at as string || undefined,
  };
}

// 通过SSH密钥内容获取用户
export async function getUserBySSHKey(content: string): Promise<{ user_id: string; key_id: number } | null> {
  const sha = generateSHA(content);
  const keys = await select('ssh_keys', {
    where: { sha: sha }
  });
  
  if (keys.length === 0) {
    return null;
  }
  
  const key = keys[0];
  
  // 更新最后使用时间
  await updateLastUsed(key.id as number);
  
  return {
    user_id: key.user_id as string,
    key_id: key.id as number,
  };
}

// 更新最后使用时间
export async function updateLastUsed(keyId: number): Promise<void> {
  const now = new Date().toISOString();
  await update('ssh_keys', { last_used_at: now }, { id: keyId });
}

// 删除SSH密钥
export async function deleteSSHKey(keyId: number, userId: string): Promise<boolean> {
  const result = await remove('ssh_keys', { id: keyId, user_id: userId });
  return result !== null && result.length > 0;
}
