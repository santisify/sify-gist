import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const redirectUri = `${baseUrl}/api/auth/github/callback`;
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'GitHub OAuth 未配置' },
      { status: 500 }
    );
  }

  // 生成随机 state 用于防止 CSRF 攻击
  const state = Math.random().toString(36).substring(2, 15);
  
  // 构建 GitHub OAuth URL
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', 'read:user user:email');
  githubAuthUrl.searchParams.set('state', state);

  // 设置 state cookie - 在 Vercel 上使用 lax 而不是 strict
  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.redirect(githubAuthUrl.toString());

  // 修复 cookie 设置，确保在 Vercel 上正常工作
  response.cookies.set('github_oauth_state', state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax', // 在 Vercel 上使用 lax 以允许跨域 cookie
    maxAge: 600, // 10 分钟
    path: '/'
  });

  return response;
}
