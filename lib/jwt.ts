import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token 有效期 7 天
const JWT_REFRESH_EXPIRES_IN = '30d'; // Refresh token 有效期 30 天

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * 生成访问令牌和刷新令牌
 */
export function generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
  const accessToken = jwt.sign(
    { userId: payload.userId, email: payload.email, name: payload.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId: payload.userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  // 解码获取过期时间
  const decoded = jwt.decode(accessToken) as JwtPayload;

  return {
    accessToken,
    refreshToken,
    expiresIn: decoded.exp! - decoded.iat!,
  };
}

/**
 * 生成访问令牌（兼容旧接口）
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, name: payload.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * 验证令牌
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Token 验证失败:', error);
    return null;
  }
}

/**
 * 验证刷新令牌
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'refresh') {
      return null;
    }
    return { userId: decoded.userId };
  } catch (error) {
    console.error('Refresh token 验证失败:', error);
    return null;
  }
}

/**
 * 从请求头提取令牌
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * 从请求中获取用户信息
 */
export function getUserFromRequest(request: Request): JwtPayload | null {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

/**
 * 获取用户 ID（便捷方法）
 */
export function getUserIdFromRequest(request: Request): string | null {
  const payload = getUserFromRequest(request);
  return payload?.userId || null;
}
