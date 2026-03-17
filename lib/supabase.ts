import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // For server-side operations requiring higher privileges, use SERVICE_ROLE_KEY
    // For client-side operations, use NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment.');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
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