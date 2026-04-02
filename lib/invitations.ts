// lib/invitations.ts
import select, { insert, update, remove } from './db';
import { getSupabaseClient } from './supabase';
import crypto from 'crypto';

export interface Invitation {
  id?: number;
  code: string;
  expires_at?: string;
  nb_used: number;
  nb_max: number; // 0 表示无限制
}

export interface CreateInvitationData {
  expires_at?: string;
  nb_max?: number;
}

// 生成随机邀请码
export function generateInvitationCode(): string {
  const bytes = crypto.randomBytes(8);
  return bytes.toString('hex').toUpperCase();
}

// 创建邀请码
export async function createInvitation(data: CreateInvitationData = {}): Promise<Invitation> {
  const code = generateInvitationCode();
  
  const invitationData = {
    code: code,
    expires_at: data.expires_at || null,
    nb_used: 0,
    nb_max: data.nb_max || 0,
  };
  
  const result = await insert('invitations', invitationData);
  
  return {
    id: result && result[0] ? result[0].id : undefined,
    code: code,
    expires_at: data.expires_at,
    nb_used: 0,
    nb_max: data.nb_max || 0,
  };
}

// 获取所有邀请码
export async function getAllInvitations(): Promise<Invitation[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('获取邀请码失败:', error);
    return [];
  }
  
  return (data || []).map((inv: any) => ({
    id: inv.id as number,
    code: inv.code as string,
    expires_at: inv.expires_at as string || undefined,
    nb_used: inv.nb_used as number,
    nb_max: inv.nb_max as number,
  }));
}

// 通过邀请码获取邀请信息
export async function getInvitationByCode(code: string): Promise<Invitation | null> {
  const invitations = await select('invitations', {
    where: { code: code.toUpperCase() }
  });
  
  if (invitations.length === 0) {
    return null;
  }
  
  const inv = invitations[0];
  return {
    id: inv.id as number,
    code: inv.code as string,
    expires_at: inv.expires_at as string || undefined,
    nb_used: inv.nb_used as number,
    nb_max: inv.nb_max as number,
  };
}

// 检查邀请码是否可用
export async function isInvitationUsable(code: string): Promise<boolean> {
  const invitation = await getInvitationByCode(code);
  
  if (!invitation) {
    return false;
  }
  
  // 检查是否过期
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return false;
  }
  
  // 检查是否达到使用上限
  if (invitation.nb_max > 0 && invitation.nb_used >= invitation.nb_max) {
    return false;
  }
  
  return true;
}

// 使用邀请码
export async function useInvitation(code: string): Promise<boolean> {
  const invitation = await getInvitationByCode(code);
  
  if (!invitation || !invitation.id) {
    return false;
  }
  
  // 检查是否可用
  if (!await isInvitationUsable(code)) {
    return false;
  }
  
  // 增加使用次数
  await update('invitations', 
    { nb_used: invitation.nb_used + 1 }, 
    { id: invitation.id }
  );
  
  return true;
}

// 删除邀请码
export async function deleteInvitation(invitationId: number): Promise<boolean> {
  const result = await remove('invitations', { id: invitationId });
  return result !== null && result.length > 0;
}

// 获取可用邀请码列表
export async function getUsableInvitations(): Promise<Invitation[]> {
  const allInvitations = await getAllInvitations();
  const now = new Date();
  
  return allInvitations.filter(inv => {
    // 检查是否过期
    if (inv.expires_at && new Date(inv.expires_at) < now) {
      return false;
    }
    
    // 检查是否达到使用上限
    if (inv.nb_max > 0 && inv.nb_used >= inv.nb_max) {
      return false;
    }
    
    return true;
  });
}
