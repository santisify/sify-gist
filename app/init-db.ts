// app/init-db.ts
'use server';

import { initSupabaseTables } from '@/lib/supabase';

// 数据库初始化函数
export async function initializeDatabase() {
  try {
    await initSupabaseTables();
    console.log('Supabase 连接成功');
  } catch (error) {
    console.error('Supabase 连接失败:', error);
    throw error;
  }
}
