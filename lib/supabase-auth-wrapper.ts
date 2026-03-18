// lib/supabase-auth-wrapper.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// 创建一个 Supabase 客户端的包装器，支持动态认证令牌
class SupabaseAuthWrapper {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables.');
    }
  }

  // 获取客户端实例，使用当前认证令牌（如果存在）
  getClient(): SupabaseClient<Database> {
    // 获取存储的认证令牌
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
    
    // 如果存在令牌，则使用它创建客户端实例
    if (token) {
      return createClient<Database>(
        this.supabaseUrl,
        this.supabaseAnonKey,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
    }

    // 否则，使用基本配置创建客户端
    return createClient<Database>(this.supabaseUrl, this.supabaseAnonKey);
  }
}

// 创建单例实例
const supabaseAuthWrapper = new SupabaseAuthWrapper();

export default supabaseAuthWrapper;