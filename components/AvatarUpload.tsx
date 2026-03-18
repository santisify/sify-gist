'use client';

import { useState, useRef } from 'react';

interface AvatarUploadProps {
  userId: string;
  currentAvatar?: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

export default function AvatarUpload({ userId, currentAvatar, onAvatarUpdate }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // 创建 FormData 并上传到 API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/auth/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.avatarUrl) {
        setAvatarUrl(result.avatarUrl);
        onAvatarUpdate(result.avatarUrl);
      } else {
        setUploadError(result.error || '上传头像失败');
      }
    } catch (error: any) {
      console.error('上传头像时出错:', error);
      setUploadError(error instanceof Error ? error.message : '上传头像时发生错误');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <img
          src={avatarUrl || `https://cravatar.cn/avatar/${Date.now()}?d=identicon&s=96`}
          alt="用户头像"
          className="w-24 h-24 rounded-full border-2 border-gray-300 object-cover dark:border-gray-600"
        />
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className={`absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
            isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="更改头像"
        >
          {isUploading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="hidden"
      />
      
      {uploadError && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {uploadError}
        </div>
      )}
      
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        支持 JPG, PNG, GIF, WEBP 格式，最大 2MB
      </p>
    </div>
  );
}
