// lib/auth.ts
import select, { insert, update } from './db';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
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

export async function registerUser(data: RegisterData): Promise<User | null> {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const id = nanoid(12);
  const now = new Date().toISOString();
  
  try {
    const result = await insert('users', {
      id: id,
      name: data.name,
      email: data.email,
      password_hash: hashedPassword,
      avatar_url: null, // 新用户默认没有头像
      created_at: now
    });
    
    // 确保用户确实被插入了
    // 在 Supabase 中，insert 操作返回的是一个对象数组
    if (result && Array.isArray(result) && result.length > 0) {
      return {
        id,
        name: data.name,
        email: data.email,
        avatar_url: undefined,
        created_at: now
      };
    }
    
    // 如果插入结果为空，尝试直接查询新创建的用户
    const users = await select('users', { where: { id: id } });
    if (users && users.length > 0) {
      const user = users[0];
      return {
        id: user.id as string,
        name: user.name as string,
        email: user.email as string,
        avatar_url: user.avatar_url as string || undefined,
        created_at: user.created_at as string
      };
    }
    
    return null;
  } catch (error: any) {
    // 如果是唯一约束错误（邮箱已存在），返回 null
    if (error.code === '23505') { // PostgreSQL unique violation code
      console.error('用户邮箱已存在:', error);
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
    email: user.email as string,
    avatar_url: user.avatar_url as string || undefined,
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
        email: user.email as string,
        avatar_url: user.avatar_url as string || undefined,
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
        email: user.email as string,
        avatar_url: updateData.avatar_url || user.avatar_url as string || undefined,
        created_at: user.created_at as string
      };
    }

    // 4. 如果都不存在，创建新用户
    const id = nanoid(12);
    const now = new Date().toISOString();
    
    const result = await insert('users', {
      id: id,
      name: data.name,
      email: data.email,
      password_hash: null, // OAuth 用户没有密码
      github_id: data.githubId,
      avatar_url: data.avatarUrl || null,
      created_at: now
    });
    
    return {
      id,
      name: data.name,
      email: data.email,
      avatar_url: data.avatarUrl,
      created_at: now
    };
  } catch (error: any) {
    console.error('GitHub OAuth 登录失败:', error);
    return null;
  }
}