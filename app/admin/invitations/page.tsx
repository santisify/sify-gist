'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Invitation {
  id: number;
  code: string;
  expires_at?: string;
  nb_used: number;
  nb_max: number;
}

export default function InvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInvitation, setNewInvitation] = useState({
    expires_at: '',
    nb_max: 0,
  });

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const response = await fetch('/api/invitations');
      if (response.status === 403) {
        router.push('/');
        return;
      }
      
      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error('加载邀请码失败:', error);
      setMessage('加载邀请码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvitation),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`邀请码创建成功: ${data.invitation.code}`);
        setShowCreateForm(false);
        setNewInvitation({ expires_at: '', nb_max: 0 });
        loadInvitations();
      } else {
        setMessage(data.error || '创建失败');
      }
    } catch (error) {
      console.error('创建邀请码失败:', error);
      setMessage('创建邀请码失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此邀请码吗？')) return;
    
    try {
      const response = await fetch(`/api/invitations?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (response.ok) {
        setMessage('邀请码已删除');
        loadInvitations();
      } else {
        setMessage(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除邀请码失败:', error);
      setMessage('删除邀请码失败');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessage('邀请码已复制到剪贴板');
    setTimeout(() => setMessage(''), 3000);
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExhausted = (invitation: Invitation) => {
    return invitation.nb_max > 0 && invitation.nb_used >= invitation.nb_max;
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">邀请码管理</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showCreateForm ? '取消' : '创建邀请码'}
          </button>
        </div>
        
        {message && (
          <div className={`mb-4 p-4 rounded ${message.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
            <button onClick={() => setMessage('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* 创建表单 */}
        {showCreateForm && (
          <div className="mb-6 p-6 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <h2 className="text-xl font-semibold mb-4">创建新邀请码</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block mb-2">过期时间（可选）</label>
                <input
                  type="datetime-local"
                  value={newInvitation.expires_at}
                  onChange={(e) => setNewInvitation({ ...newInvitation, expires_at: e.target.value })}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                />
              </div>
              <div>
                <label className="block mb-2">最大使用次数（0 表示无限制）</label>
                <input
                  type="number"
                  min="0"
                  value={newInvitation.nb_max}
                  onChange={(e) => setNewInvitation({ ...newInvitation, nb_max: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                创建
              </button>
            </form>
          </div>
        )}
        
        {/* 邀请码列表 */}
        <div className="space-y-3">
          {invitations.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
              暂无邀请码
            </div>
          ) : (
            invitations.map(invitation => {
              const expired = isExpired(invitation.expires_at);
              const exhausted = isExhausted(invitation);
              const isActive = !expired && !exhausted;
              
              return (
                <div
                  key={invitation.id}
                  className="p-4 border rounded-lg"
                  style={{ 
                    borderColor: 'var(--color-border)', 
                    backgroundColor: 'var(--color-card)',
                    opacity: isActive ? 1 : 0.6,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-lg font-mono font-bold">{invitation.code}</code>
                        <button
                          onClick={() => copyToClipboard(invitation.code)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        >
                          复制
                        </button>
                        {!isActive && (
                          <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                            {expired ? '已过期' : '已用完'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                        <p>
                          使用情况: {invitation.nb_used} / {invitation.nb_max === 0 ? '无限制' : invitation.nb_max}
                        </p>
                        {invitation.expires_at && (
                          <p>
                            过期时间: {new Date(invitation.expires_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(invitation.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
