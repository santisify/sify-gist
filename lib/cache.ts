// lib/cache.ts
// 简单的内存缓存实现，用于缓存 API 响应

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 每 5 分钟清理一次过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, item] of entries) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// 全局缓存实例
export const cache = new MemoryCache();

// 缓存键生成器
export const CacheKeys = {
  allGists: (page: number, limit: number, userId?: string) => 
    `gists:all:${page}:${limit}:${userId || 'public'}`,
  
  gistById: (id: string) => 
    `gist:${id}`,
  
  gistsByUser: (userId: string, page: number, limit: number) => 
    `gists:user:${userId}:${page}:${limit}`,
  
  gistsByTopic: (topic: string, page: number, limit: number) => 
    `gists:topic:${topic}:${page}:${limit}`,
  
  gistsByLanguage: (language: string, page: number, limit: number) => 
    `gists:language:${language}:${page}:${limit}`,
  
  popularTopics: (limit: number) => 
    `topics:popular:${limit}`,
  
  popularLanguages: (limit: number) =>
    `languages:popular:${limit}`,

  trendingGists: (page: number, limit: number, days?: number) =>
    `gists:trending:${page}:${limit}:${days || 30}`,

  userById: (userId: string) => 
    `user:${userId}`,
  
  adminSettings: () => 
    'admin:settings',
};

// 缓存装饰器
export function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const cached = cache.get<T>(key);
    if (cached) {
      resolve(cached);
      return;
    }

    try {
      const data = await fetcher();
      cache.set(key, data, ttl);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

// 缓存 TTL 常量（毫秒）
export const CacheTTL = {
  SHORT: 30 * 1000,      // 30 秒
  MEDIUM: 5 * 60 * 1000, // 5 分钟
  LONG: 30 * 60 * 1000,  // 30 分钟
  HOUR: 60 * 60 * 1000,  // 1 小时
};
