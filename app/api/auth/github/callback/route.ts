import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUserByGitHub } from '@/lib/auth';
import { generateTokenPair } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const storedState = request.cookies.get('github_oauth_state')?.value;
    const codeVerifier = request.cookies.get('github_oauth_code_verifier')?.value;

    const isProduction = process.env.NODE_ENV === 'production';

    // 验证 state 防止 CSRF 攻击
    if (!code || !state) {
      console.error('GitHub OAuth Callback - 缺少参数:', {
        hasCode: !!code,
        hasState: !!state
      });
      return NextResponse.json(
        { error: 'oauth_invalid_state', message: '缺少必要的参数' },
        { status: 400 }
      );
    }

    if (state !== storedState) {
      console.error('GitHub OAuth Callback - State 不匹配:', {
        requestState: state,
        cookieState: storedState
      });
      return NextResponse.json(
        { error: 'oauth_invalid_state', message: 'State 参数不匹配' },
        { status: 400 }
      );
    }

    // 验证 code verifier (PKCE)
    if (!codeVerifier) {
      console.error('GitHub OAuth Callback - 缺少 code verifier');
      return NextResponse.json(
        { error: 'oauth_pkce_failed', message: '缺少 PKCE code verifier' },
        { status: 400 }
      );
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/login?error=oauth_not_configured', request.url)
      );
    }

    // 交换 code 获取 access token (使用 PKCE)
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
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/github/callback`,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub OAuth token error:', tokenData.error);
      return NextResponse.redirect(
        new URL(`/login?error=oauth_token_error&message=${encodeURIComponent(tokenData.error_description || '')}`, request.url)
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

    if (!userResponse.ok) {
      console.error('GitHub user fetch error:', await userResponse.text());
      return NextResponse.redirect(
        new URL('/login?error=github_user_error', request.url)
      );
    }

    const githubUser = await userResponse.json();

    // 获取用户邮箱（如果公开邮箱不存在）
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        // 使用主邮箱或第一个验证过的邮箱
        const primaryEmail = emails.find((e: any) => e.primary && e.verified);
        email = primaryEmail?.email || emails.find((e: any) => e.verified)?.email;
      }
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

    // 创建响应对象 - 返回 JSON 让前端处理重定向
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      message: 'GitHub 登录成功'
    });

    // 设置认证 cookies（与登录/注册保持一致）
    response.cookies.set('userToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    // 清除 OAuth cookies
    response.cookies.set('github_oauth_state', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('github_oauth_code_verifier', '', {
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