import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    if (!clientId) {
      return NextResponse.json(
        { error: 'GitHub OAuth 未配置' },
        { status: 500 }
      );
    }

    // 生成 PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // 生成随机 state 用于防止 CSRF 攻击
    const state = crypto.randomBytes(32).toString('hex');

    // 构建 GitHub OAuth URL - 重定向到后端 API 回调端点
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    githubAuthUrl.searchParams.set('redirect_uri', `${baseUrl}/api/auth/github/callback`);
    githubAuthUrl.searchParams.set('scope', 'read:user user:email');
    githubAuthUrl.searchParams.set('state', state);
    githubAuthUrl.searchParams.set('code_challenge', codeChallenge);
    githubAuthUrl.searchParams.set('code_challenge_method', 'S256');

    // 创建响应并设置安全 cookies
    const response = NextResponse.redirect(githubAuthUrl.toString());

    // 设置 state cookie
    response.cookies.set('github_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 分钟
      path: '/'
    });

    // 设置 PKCE code verifier cookie
    response.cookies.set('github_oauth_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 分钟
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('GitHub OAuth initialization error:', error);
    return NextResponse.redirect(
      new URL('/login?error=oauth_init_failed', request.url)
    );
  }
}