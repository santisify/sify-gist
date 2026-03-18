import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

let supabaseInstance: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment.');
    }

    supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey);
  }

  return supabaseInstance;
}

// 初始化 Supabase 表结构的函数
export async function initSupabaseTables() {
  const supabase = getSupabaseClient();

  // 注意：在实际项目中，您应该通过 Supabase 仪表板或迁移脚本创建这些表
  // 以下代码仅用于演示目的

  console.log('Supabase 初始化完成');
}