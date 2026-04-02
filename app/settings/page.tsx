'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Token {
  id: number;
  name: string;
  scope_gist: number;
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
}

interface SSHKey {
  id: number;
  title: string;
  sha: string;
  created_at: string;
  last_used_at?: string;
}

export default function UserSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tokens' | 'ssh'>('tokens');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [sshKeys, setSSHKeys] = useState<SSHKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newToken, setNewToken] = useState({ name: '', scope_gist: 1, expires_at: '' });
  const [newSSHKey, setNewSSHKey] = useState({ title: '', content: '' });
  const [showToken, setShowToken] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadTokens(), loadSSHKeys()]);
    setLoading(false);
  };

  const loadTokens = async () => {
    try {
      const response = await fetch('/api/tokens');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error('加载令牌失败:', error);
    }
  };

  const loadSSHKeys = async () => {
    try {
      const response = await fetch('/api/ssh-keys');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setSSHKeys(data.keys || []);
    } catch (error) {
      console.error('加载 SSH 密钥失败:', error);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newToken),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('令牌创建成功！请立即复制，系统不会再次显示。');
        setShowToken(data.plainToken);
        setNewToken({ name: '', scope_gist: 1, expires_at: '' });
        loadTokens();
      } else {
        setMessage(data.error || '创建失败');
      }
    } catch (error) {
      console.error('创建令牌失败:', error);
      setMessage('创建令牌失败');
    }
  };

  const handleDeleteToken = async (id: number) => {
    if (!confirm('确定要删除此令牌吗？')) return;
    
    try {
      const response = await fetch(`/api/tokens?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (response.ok) {
        setMessage('令牌已删除');
        loadTokens();
      } else {
        setMessage(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除令牌失败:', error);
      setMessage('删除令牌失败');
    }
  };

  const handleCreateSSHKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/ssh-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSSHKey),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('SSH 密钥添加成功');
        setNewSSHKey({ title: '', content: '' });
        loadSSHKeys();
      } else {
        setMessage(data.error || '添加失败');
      }
    } catch (error) {
      console.error('添加 SSH 密钥失败:', error);
      setMessage('添加 SSH 密钥失败');
    }
  };

  const handleDeleteSSHKey = async (id: number) => {
    if (!confirm('确定要删除此 SSH 密钥吗？')) return;
    
    try {
      const response = await fetch(`/api/ssh-keys?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (response.ok) {
        setMessage('SSH 密钥已删除');
        loadSSHKeys();
      } else {
        setMessage(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除 SSH 密钥失败:', error);
      setMessage('删除 SSH 密钥失败');
    }
  };

  const getScopeLabel = (scope: number) => {
    const labels = ['无权限', '只读', '读写'];
    return labels[scope] || '未知';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">个人设置</h1>
        
        {message && (
          <div className={`mb-4 p-4 rounded ${message.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
            <button onClick={() => setMessage('')} className="float-right font-bold">×</button>
          </div>
        )}
        
        {/* 标签切换 */}
        <div className="flex border-b mb-6" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-6 py-3 font-medium ${activeTab === 'tokens' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
          >
            访问令牌
          </button>
          <button
            onClick={() => setActiveTab('ssh')}
            className={`px-6 py-3 font-medium ${activeTab === 'ssh' ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}
          >
            SSH 密钥
          </button>
        </div>

        {/* 访问令牌 */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            {/* 创建令牌表单 */}
            <div className="p-6 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <h2 className="text-xl font-semibold mb-4">创建新令牌</h2>
              <form onSubmit={handleCreateToken} className="space-y-4">
                <div>
                  <label className="block mb-2">令牌名称</label>
                  <input
                    type="text"
                    value={newToken.name}
                    onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">权限范围</label>
                  <select
                    value={newToken.scope_gist}
                    onChange={(e) => setNewToken({ ...newToken, scope_gist: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                  >
                    <option value={1}>只读</option>
                    <option value={2}>读写</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">过期时间（可选）</label>
                  <input
                    type="datetime-local"
                    value={newToken.expires_at}
                    onChange={(e) => setNewToken({ ...newToken, expires_at: e.target.value })}
                    className="w-full p-2 border rounded"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  创建令牌
                </button>
              </form>
            </div>

            {/* 显示新令牌 */}
            {showToken && (
              <div className="p-6 border rounded-lg bg-green-50 border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">⚠️ 请立即复制此令牌</h3>
                <code className="block p-3 bg-white border rounded text-sm break-all">{showToken}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(showToken);
                    setMessage('令牌已复制到剪贴板');
                  }}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded text-sm"
                >
                  复制到剪贴板
                </button>
                <button
                  onClick={() => setShowToken(null)}
                  className="mt-2 ml-2 px-4 py-2 bg-gray-600 text-white rounded text-sm"
                >
                  关闭
                </button>
              </div>
            )}

            {/* 令牌列表 */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">现有令牌</h2>
              {tokens.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)' }}>暂无访问令牌</p>
              ) : (
                tokens.map(token => (
                  <div
                    key={token.id}
                    className="p-4 border rounded-lg flex justify-between items-center"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
                  >
                    <div>
                      <h3 className="font-semibold">{token.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        权限: {getScopeLabel(token.scope_gist)} | 
                        创建于: {new Date(token.created_at).toLocaleString()} |
                        {token.expires_at && ` 过期于: ${new Date(token.expires_at).toLocaleString()}`}
                        {token.last_used_at && ` | 最后使用: ${new Date(token.last_used_at).toLocaleString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteToken(token.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SSH 密钥 */}
        {activeTab === 'ssh' && (
          <div className="space-y-6">
            {/* 添加 SSH 密钥表单 */}
            <div className="p-6 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <h2 className="text-xl font-semibold mb-4">添加 SSH 密钥</h2>
              <form onSubmit={handleCreateSSHKey} className="space-y-4">
                <div>
                  <label className="block mb-2">密钥标题</label>
                  <input
                    type="text"
                    value={newSSHKey.title}
                    onChange={(e) => setNewSSHKey({ ...newSSHKey, title: e.target.value })}
                    className="w-full p-2 border rounded"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                    placeholder="例如: MacBook Pro"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">SSH 公钥</label>
                  <textarea
                    value={newSSHKey.content}
                    onChange={(e) => setNewSSHKey({ ...newSSHKey, content: e.target.value })}
                    className="w-full p-2 border rounded h-32 font-mono text-sm"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                    placeholder="以 ssh- 开头的公钥内容"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  添加密钥
                </button>
              </form>
            </div>

            {/* SSH 密钥列表 */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">现有 SSH 密钥</h2>
              {sshKeys.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)' }}>暂无 SSH 密钥</p>
              ) : (
                sshKeys.map(key => (
                  <div
                    key={key.id}
                    className="p-4 border rounded-lg"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{key.title}</h3>
                        <p className="text-sm font-mono mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          SHA-256: {key.sha}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          添加于: {new Date(key.created_at).toLocaleString()}
                          {key.last_used_at && ` | 最后使用: ${new Date(key.last_used_at).toLocaleString()}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteSSHKey(key.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
