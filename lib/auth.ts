// lib/auth.ts
import select, { insert, update } from './db';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export interface User {
  id: string;
  name: string;
  username_normalized?: string;
  email: string;
  avatar_url?: string;
  is_admin?: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface GitHubUserData {
  githubId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export async function authenticateUser(credentials: LoginCredentials): Promise<User | null> {
  // 从数据库查找用户
  const users = await select('users', {
    where: { email: credentials.email }
  });

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  const isValid = await bcrypt.compare(credentials.password, user.password_hash);
  
  if (isValid) {
    return {
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      avatar_url: user.avatar_url as string || undefined,
      created_at: user.created_at as string
    };
  }
  
  return null;
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await select('users', {
    where: { id: id }
  });

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  return {
    id: user.id as string,
    name: user.name as string,
    email: user.email as string,
    avatar_url: user.avatar_url as string || undefined,
    created_at: user.created_at as string
  };
}

export async function registerUser(data: RegisterData, invitationCode?: string): Promise<User | null> {
  // 检查是否禁用注册
  const { isSignupDisabled } = await import('./admin-settings');
  if (await isSignupDisabled()) {
    throw new Error('注册已被禁用');
  }

  // 检查邀请码（如果需要）
  const { isInvitationUsable, useInvitation } = await import('./invitations');
  if (invitationCode) {
    const usable = await isInvitationUsable(invitationCode);
    if (!usable) {
      throw new Error('邀请码无效或已过期');
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const id = nanoid(12);
  const now = new Date().toISOString();
  const usernameNormalized = data.name.toLowerCase();
  
  try {
    const result = await insert('users', {
      id: id,
      name: data.name,
      username_normalized: usernameNormalized,
      email: data.email,
      password_hash: hashedPassword,
      avatar_url: null,
      is_admin: false,
      created_at: now
    });
    
    // 使用邀请码
    if (invitationCode) {
      await useInvitation(invitationCode);
    }
    
    if (result && Array.isArray(result) && result.length > 0) {
      return {
        id,
        name: data.name,
        username_normalized: usernameNormalized,
        email: data.email,
        avatar_url: undefined,
        is_admin: false,
        created_at: now
      };
    }
    
    const users = await select('users', { where: { id: id } });
    if (users && users.length > 0) {
      const user = users[0];
      return {
        id: user.id as string,
        name: user.name as string,
        username_normalized: user.username_normalized as string,
        email: user.email as string,
        avatar_url: user.avatar_url as string || undefined,
        is_admin: user.is_admin as boolean || false,
        created_at: user.created_at as string
      };
    }
    
    return null;
  } catch (error: any) {
    if (error.code === '23505') {
      console.error('用户邮箱或用户名已存在:', error);
      return null;
    }
    console.error('注册用户时出错:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await select('users', {
    where: { email: email }
  });

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  return {
    id: user.id as string,
    name: user.name as string,
    username_normalized: user.username_normalized as string,
    email: user.email as string,
    avatar_url: user.avatar_url as string || undefined,
    is_admin: user.is_admin as boolean || false,
    created_at: user.created_at as string
  };
}

/**
 * 通过 GitHub OAuth 查找或创建用户
 * 1. 先通过 github_id 查找用户
 * 2. 如果存在则返回用户
 * 3. 如果不存在则通过 email 查找
 * 4. 如果通过 email 找到用户，更新其 github_id
 * 5. 如果都不存在，创建新用户
 */
export async function findOrCreateUserByGitHub(data: GitHubUserData): Promise<User | null> {
  try {
    // 1. 先通过 github_id 查找用户
    const usersByGithubId = await select('users', {
      where: { github_id: data.githubId }
    });

    if (usersByGithubId.length > 0) {
      const user = usersByGithubId[0];
      return {
        id: user.id as string,
        name: user.name as string,
        username_normalized: user.username_normalized as string,
        email: user.email as string,
        avatar_url: user.avatar_url as string || undefined,
        is_admin: user.is_admin as boolean || false,
        created_at: user.created_at as string
      };
    }

    // 2. 如果不存在，通过 email 查找
    const usersByEmail = await select('users', {
      where: { email: data.email }
    });

    if (usersByEmail.length > 0) {
      // 3. 如果通过 email 找到用户，更新其 github_id 和 avatar_url
      const user = usersByEmail[0];
      const updateData: any = { github_id: data.githubId };
      
      // 如果用户没有头像，使用 GitHub 头像
      if (!user.avatar_url && data.avatarUrl) {
        updateData.avatar_url = data.avatarUrl;
      }
      
      await update('users', updateData, { id: user.id });
      
      return {
        id: user.id as string,
        name: user.name as string,
        username_normalized: user.username_normalized as string,
        email: user.email as string,
        avatar_url: updateData.avatar_url || user.avatar_url as string || undefined,
        is_admin: user.is_admin as boolean || false,
        created_at: user.created_at as string
      };
    }

    // 4. 如果都不存在，创建新用户
    const id = nanoid(12);
    const now = new Date().toISOString();
    const usernameNormalized = data.name.toLowerCase();
    
    const result = await insert('users', {
      id: id,
      name: data.name,
      username_normalized: usernameNormalized,
      email: data.email,
      password_hash: null, // OAuth 用户没有密码
      github_id: data.githubId,
      avatar_url: data.avatarUrl || null,
      is_admin: false,
      created_at: now
    });
    
    return {
      id,
      name: data.name,
      username_normalized: usernameNormalized,
      email: data.email,
      avatar_url: data.avatarUrl,
      is_admin: false,
      created_at: now
    };
  } catch (error: any) {
    console.error('GitHub OAuth 登录失败:', error);
    return null;
  }
}

export interface GitLabUserData {
  gitlabId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

/**
 * 通过 GitLab OAuth 查找或创建用户
 */
export async function findOrCreateUserByGitLab(data: GitLabUserData): Promise<User | null> {
  try {
    const usersByGitLabId = await select('users', {
      where: { gitlab_id: data.gitlabId }
    });

    if (usersByGitLabId.length > 0) {
      const user = usersByGitLabId[0];
      return {
        id: user.id as string,
        name: user.name as string,
        username_normalized: user.username_normalized as string,
        email: user.email as string,
        avatar_url: user.avatar_url as string || undefined,
        is_admin: user.is_admin as boolean || false,
        created_at: user.created_at as string
      };
    }

    const usersByEmail = await select('users', {
      where: { email: data.email }
    });

    if (usersByEmail.length > 0) {
      const user = usersByEmail[0];
      const updateData: any = { gitlab_id: data.gitlabId };
      
      if (!user.avatar_url && data.avatarUrl) {
        updateData.avatar_url = data.avatarUrl;
      }
      
      await update('users', updateData, { id: user.id });
      
      return {
        id: user.id as string,
        name: user.name as string,
        username_normalized: user.username_normalized as string,
        email: user.email as string,
        avatar_url: updateData.avatar_url || user.avatar_url as string || undefined,
        is_admin: user.is_admin as boolean || false,
        created_at: user.created_at as string
      };
    }

    const id = nanoid(12);
    const now = new Date().toISOString();
    const usernameNormalized = data.name.toLowerCase();
    
    await insert('users', {
      id: id,
      name: data.name,
      username_normalized: usernameNormalized,
      email: data.email,
      password_hash: null,
      gitlab_id: data.gitlabId,
      avatar_url: data.avatarUrl || null,
      is_admin: false,
      created_at: now
    });
    
    return {
      id,
      name: data.name,
      username_normalized: usernameNormalized,
      email: data.email,
      avatar_url: data.avatarUrl,
      is_admin: false,
      created_at: now
    };
  } catch (error: any) {
    console.error('GitLab OAuth 登录失败:', error);
    return null;
  }
}

export interface GiteaUserData {
  giteaId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

/**
 * 通过 Gitea OAuth 查找或创建用户
 */
export async function findOrCreateUserByGitea(data: GiteaUserData): Promise<User | null> {
  try {
    const usersByGiteaId = await select('users', {
      where: { gitea_id: data.giteaId }
    });

    if (usersByGiteaId.length > 0) {
      const user = usersByGiteaId[0];
      return {
        id: user.id as string,
        name: user.name as string,
        username_normalized: user.username_normalized as string,
        email: user.email as string,
        avatar_url: user.avatar_url as string || undefined,
        is_admin: user.is_admin as boolean || false,
        created_at: user.created_at as string
      };
    }

    const usersByEmail = await select('users', {
      where: { email: data.email }
    });

    if (usersByEmail.length > 0) {
      const user = usersByEmail[0];
      const updateData: any = { gitea_id: data.giteaId };
      
      if (!user.avatar_url && data.avatarUrl) {
        updateData.avatar_url = data.avatarUrl;
      }
      
      await update('users', updateData, { id: user.id });
      
      return {
        id: user.id as string,
        name: user.name as string,
        username_normalized: user.username_normalized as string,
        email: user.email as string,
        avatar_url: updateData.avatar_url || user.avatar_url as string || undefined,
        is_admin: user.is_admin as boolean || false,
        created_at: user.created_at as string
      };
    }

    const id = nanoid(12);
    const now = new Date().toISOString();
    const usernameNormalized = data.name.toLowerCase();
    
    await insert('users', {
      id: id,
      name: data.name,
      username_normalized: usernameNormalized,
      email: data.email,
      password_hash: null,
      gitea_id: data.giteaId,
      avatar_url: data.avatarUrl || null,
      is_admin: false,
      created_at: now
    });
    
    return {
      id,
      name: data.name,
      username_normalized: usernameNormalized,
      email: data.email,
      avatar_url: data.avatarUrl,
      is_admin: false,
      created_at: now
    };
  } catch (error: any) {
    console.error('Gitea OAuth 登录失败:', error);
    return null;
  }
}

export interface OIDCUserData {
  oidcId: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

/**
 * 通过 OIDC OAuth 查找或创建用户
 */
export async function findOrCreateUserByOIDC(data: OIDCUserData): Promise<User | null> {
  try {
    const usersByOIDCId = await select('users', {
      where: { oidc_id: data.oidcId }
    });

    if (usersByOIDCId.length > 0) {
      const user = usersByOIDCId[0];
      return {
        id: user.id as string,
        name: user.name as string,
        username_normalized: user.username_normalized as string,
        email: user.email as string,
        avatar_url: user.avatar_url as string || undefined,
        is_admin: user.is_admin as boolean || false,
        created_at: user.created_at as string
      };
    }

    const usersByEmail = await select('users', {
      where: { email: data.email }
    });

    if (usersByEmail.length > 0) {
      const user = usersByEmail[0];
      const updateData: any = { oidc_id: data.oidcId };
      
      if (!user.avatar_url && data.avatarUrl) {
        updateData.avatar_url = data.avatarUrl;
      }
      
      await update('users', updateData, { id: user.id });
      
      return {
        id: user.id as string,
        name: user.name as string,
        username_normalized: user.username_normalized as string,
        email: user.email as string,
        avatar_url: updateData.avatar_url || user.avatar_url as string || undefined,
        is_admin: user.is_admin as boolean || false,
        created_at: user.created_at as string
      };
    }

    const id = nanoid(12);
    const now = new Date().toISOString();
    const usernameNormalized = data.name.toLowerCase();
    
    await insert('users', {
      id: id,
      name: data.name,
      username_normalized: usernameNormalized,
      email: data.email,
      password_hash: null,
      oidc_id: data.oidcId,
      avatar_url: data.avatarUrl || null,
      is_admin: false,
      created_at: now
    });
    
    return {
      id,
      name: data.name,
      username_normalized: usernameNormalized,
      email: data.email,
      avatar_url: data.avatarUrl,
      is_admin: false,
      created_at: now
    };
  } catch (error: any) {
    console.error('OIDC OAuth 登录失败:', error);
    return null;
  }
}

/**
 * 通过用户名规范化查找用户（大小写不敏感）
 */
export async function getUserByUsernameNormalized(username: string): Promise<User | null> {
  const users = await select('users', {
    where: { username_normalized: username.toLowerCase() }
  });

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  return {
    id: user.id as string,
    name: user.name as string,
    username_normalized: user.username_normalized as string,
    email: user.email as string,
    avatar_url: user.avatar_url as string || undefined,
    is_admin: user.is_admin as boolean || false,
    created_at: user.created_at as string
  };
}