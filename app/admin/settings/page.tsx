'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SettingKeys } from '@/lib/admin-settings';

interface Settings {
  [key: string]: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.status === 403) {
        router.push('/');
        return;
      }
      
      const data = await response.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
      setMessage('加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key] === '1' ? '0' : '1',
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('设置已保存');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      setMessage('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  const settingItems = [
    {
      key: SettingKeys.DISABLE_SIGNUP,
      title: '禁用注册',
      description: '禁止新用户注册，只有管理员可以创建用户',
    },
    {
      key: SettingKeys.REQUIRE_LOGIN,
      title: '需要登录',
      description: '所有页面都需要登录才能访问',
    },
    {
      key: SettingKeys.ALLOW_GISTS_WITHOUT_LOGIN,
      title: '允许未登录访问 Gists',
      description: '即使启用了需要登录，也允许未登录用户查看公开的 Gists',
    },
    {
      key: SettingKeys.DISABLE_LOGIN_FORM,
      title: '禁用登录表单',
      description: '禁用用户名密码登录，只允许 OAuth 登录',
    },
    {
      key: SettingKeys.DISABLE_GRAVATAR,
      title: '禁用 Gravatar',
      description: '不使用 Gravatar 头像服务',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">管理员设置</h1>
        
        {message && (
          <div className={`mb-4 p-4 rounded ${message.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
        
        <div className="space-y-4">
          {settingItems.map(item => (
            <div 
              key={item.key}
              className="p-4 border rounded-lg flex items-center justify-between"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
            >
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[item.key] === '1'}
                  onChange={() => handleToggle(item.key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
