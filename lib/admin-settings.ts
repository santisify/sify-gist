// lib/admin-settings.ts
import select, { insert, update } from './db';
import { getSupabaseClient } from './supabase';

export interface AdminSetting {
  key: string;
  value: string;
}

// 管理员设置键名常量
export const SettingKeys = {
  DISABLE_SIGNUP: 'disable-signup',
  REQUIRE_LOGIN: 'require-login',
  ALLOW_GISTS_WITHOUT_LOGIN: 'allow-gists-without-login',
  DISABLE_LOGIN_FORM: 'disable-login-form',
  DISABLE_GRAVATAR: 'disable-gravatar',
} as const;

// 获取单个设置
export async function getSetting(key: string): Promise<string | null> {
  const settings = await select('admin_settings', {
    where: { key: key }
  });
  
  if (settings.length === 0) {
    return null;
  }
  
  return settings[0].value as string;
}

// 获取所有设置
export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await select('admin_settings', {});
  
  const result: Record<string, string> = {};
  for (const setting of settings) {
    result[setting.key as string] = setting.value as string;
  }
  
  return result;
}

// 更新设置
export async function updateSetting(key: string, value: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // 使用 upsert 操作
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ key, value }, { onConflict: 'key' });
  
  if (error) {
    throw error;
  }
}

// 批量更新设置
export async function updateSettings(settings: Record<string, string>): Promise<void> {
  const supabase = getSupabaseClient();
  
  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
  }));
  
  const { error } = await supabase
    .from('admin_settings')
    .upsert(updates, { onConflict: 'key' });
  
  if (error) {
    throw error;
  }
}

// 便捷方法：检查是否需要登录
export async function isRequireLogin(): Promise<boolean> {
  const value = await getSetting(SettingKeys.REQUIRE_LOGIN);
  return value === '1';
}

// 便捷方法：检查是否允许未登录访问Gists
export async function isAllowGistsWithoutLogin(): Promise<boolean> {
  const value = await getSetting(SettingKeys.ALLOW_GISTS_WITHOUT_LOGIN);
  return value === '1';
}

// 便捷方法：检查是否禁用注册
export async function isSignupDisabled(): Promise<boolean> {
  const value = await getSetting(SettingKeys.DISABLE_SIGNUP);
  return value === '1';
}

// 便捷方法：检查是否禁用登录表单
export async function isLoginFormDisabled(): Promise<boolean> {
  const value = await getSetting(SettingKeys.DISABLE_LOGIN_FORM);
  return value === '1';
}

// 便捷方法：检查是否禁用Gravatar
export async function isGravatarDisabled(): Promise<boolean> {
  const value = await getSetting(SettingKeys.DISABLE_GRAVATAR);
  return value === '1';
}

// 初始化默认设置（如果不存在）
export async function initializeDefaultSettings(): Promise<void> {
  const defaultSettings = {
    [SettingKeys.DISABLE_SIGNUP]: '0',
    [SettingKeys.REQUIRE_LOGIN]: '0',
    [SettingKeys.ALLOW_GISTS_WITHOUT_LOGIN]: '0',
    [SettingKeys.DISABLE_LOGIN_FORM]: '0',
    [SettingKeys.DISABLE_GRAVATAR]: '0',
  };
  
  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = await getSetting(key);
    if (existing === null) {
      await updateSetting(key, value);
    }
  }
}
