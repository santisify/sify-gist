'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isMounted, setIsMounted] = useState(false); // 用于防止服务端和客户端不匹配

  useEffect(() => {
    const updateTheme = (newTheme: Theme) => {
      setTheme(newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // 从 localStorage 获取用户首选主题
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    // 检查系统偏好设置
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 优先使用存储的主题，否则使用系统偏好，最后默认为浅色模式
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    updateTheme(initialTheme);
    setIsMounted(true);
    
    // 监听系统主题偏好的变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!storedTheme) { // 只有在用户没有明确选择主题时才跟随系统偏好
        updateTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);

    // 清理函数
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []); // 空依赖数组，确保只在挂载时执行一次

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // 更新文档类
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // 保存用户选择到 localStorage
    localStorage.setItem('theme', newTheme);
  };

  // 在组件挂载前返回一个默认状态，防止水合不匹配
  if (!isMounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}