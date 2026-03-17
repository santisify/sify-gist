// app/api/auth/check/route.ts
import { NextRequest } from 'next/server';

// 修复Next.js构建错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 在实际应用中，这里会验证 JWT token
    // 为了简单起见，我们只检查 token 是否存在且格式正确
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '缺少认证令牌' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    
    // 在实际应用中，这里应该验证 token 的有效性
    // 例如解码 JWT 并检查其签名和过期时间
    if (!token || token.length < 10) { // 简单验证
      return new Response(JSON.stringify({ error: '无效的认证令牌' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // 如果 token 有效，返回用户信息
    return new Response(JSON.stringify({ 
      authenticated: true,
      message: '认证成功'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('认证检查错误:', error);
    return new Response(JSON.stringify({ error: '认证检查失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}