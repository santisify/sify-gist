// lib/auth-utils.ts
// 用于检查用户认证状态的工具函数

export function checkAuth(): { isAuthenticated: boolean; user?: any } {
  if (typeof window === 'undefined') {
    // 服务端：无法直接访问 localStorage
    // 在实际应用中，这里可能需要检查传入的 cookies 或 headers
    return { isAuthenticated: false };
  }
  
  const token = localStorage.getItem('userToken');
  const userInfo = localStorage.getItem('userInfo');
  
  if (token && userInfo) {
    try {
      const user = JSON.parse(userInfo);
      return { 
        isAuthenticated: true, 
        user: user 
      };
    } catch (e) {
      console.error('解析用户信息失败:', e);
      return { isAuthenticated: false };
    }
  }
  
  return { isAuthenticated: false };
}

// 用于在服务端组件中检查认证状态的异步函数
export async function checkAuthServer(): Promise<{ isAuthenticated: boolean; user?: any }> {
  // 在服务端组件中，我们通常需要从 cookies 或 headers 中获取认证信息
  // 由于我们使用的是客户端存储，这里返回未认证状态
  // 实际应用中，可能需要实现 JWT 验证或会话检查
  return { isAuthenticated: false };
}