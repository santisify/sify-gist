import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUserByGitHub } from '@/lib/auth';
import { generateTokenPair } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('github_oauth_state')?.value;
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('GitHub OAuth Callback Debug:', {
    hasCode: !!code,
    hasState: !!state,
    cookieState: storedState,
    requestState: state,
    match: state === storedState,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });

  // 验证 state 防止 CSRF 攻击
  if (!code || !state) {
    console.error('GitHub OAuth: Missing code or state');
    return NextResponse.redirect(
      new URL('/login?error=oauth_invalid', request.url)
    );
  }

  if (state !== storedState) {
    console.error('GitHub OAuth: State mismatch', {
      requestState: state,
      cookieState: storedState
    });
    return NextResponse.redirect(
      new URL('/login?error=oauth_invalid', request.url)
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/login?error=oauth_not_configured', request.url)
    );
  }

  try {
    // 交换 code 获取 access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth token error:', tokenData.error);
      return NextResponse.redirect(
        new URL('/login?error=oauth_token_error', request.url)
      );
    }

    const accessToken = tokenData.access_token;

    // 获取 GitHub 用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();

    if (!userResponse.ok) {
      console.error('GitHub user fetch error:', githubUser);
      return NextResponse.redirect(
        new URL('/login?error=github_user_error', request.url)
      );
    }

    // 获取用户邮箱（如果公开邮箱不存在）
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      const emails = await emailsResponse.json();
      // 使用主邮箱或第一个验证过的邮箱
      const primaryEmail = emails.find((e: any) => e.primary && e.verified);
      email = primaryEmail?.email || emails.find((e: any) => e.verified)?.email;
    }

    if (!email) {
      return NextResponse.redirect(
        new URL('/login?error=no_email', request.url)
      );
    }

    // 查找或创建用户
    const user = await findOrCreateUserByGitHub({
      githubId: String(githubUser.id),
      name: githubUser.name || githubUser.login,
      email,
      avatarUrl: githubUser.avatar_url,
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=user_creation_failed', request.url)
      );
    }

    // 生成 JWT token
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // 创建成功响应并设置 cookies
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = NextResponse.redirect(new URL('/', baseUrl));
    
    // 设置认证 cookies
    response.cookies.set('userToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 天
      path: '/',
    });
    
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 天
      path: '/',
    });
    
    response.cookies.set('userInfo', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    }), {
      httpOnly: false, // 客户端需要读取
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // 清除 OAuth state cookie
    response.cookies.set('github_oauth_state', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=oauth_error', request.url)
    );
  }
}
