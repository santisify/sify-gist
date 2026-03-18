// lib/auth-utils.ts
import { getSupabaseClient } from './supabase';

/**
 * 设置 Supabase 客户端的用户会话
 * @param accessToken 用户访问令牌
 */
export async function setAuthSession(accessToken: string) {
  const supabase = getSupabaseClient();
  
  // 直接设置认证头，这在客户端环境中通常不是必需的，
  // 因为 Supabase 客户端会自行处理认证
  // 但我们可以确保使用正确的令牌
  const { data: { session }, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: '' // 在实际应用中，您可能还需要刷新令牌
  });

  if (error) {
    console.error('设置会话失败:', error);
    throw error;
  }

  return session;
}

/**
 * 从本地存储获取用户令牌
 */
export function getUserToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('userToken');
}

/**
 * 从本地存储获取用户信息
 */
export function getUserInfo(): any {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
}

/**
 * 检查用户是否已认证
 */
export function isAuthenticated(): boolean {
  const token = getUserToken();
  const userInfo = getUserInfo();
  
  return !!token && !!userInfo;
}