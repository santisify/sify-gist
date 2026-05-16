// lib/cache-manager.ts
import { cache, CacheKeys } from './cache';

// 清除所有 Gist 相关的缓存
export function clearGistCache(gistId?: string) {
  if (gistId) {
    // 清除单个 Gist 的缓存
    cache.delete(CacheKeys.gistById(gistId));
  }
  
  // 皴力解决方案：直接清除所有缓存
  cache.clear();
}