// next.config.js
/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  trailingSlash: true,
  
  // 启用严格模式
  reactStrictMode: true,
  
  // 压缩配置
  compress: true,
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cravatar.cn',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  
  // 实验性功能
  experimental: {
    serverComponentsExternalPackages: ['prismjs'],
    // 优化包大小
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
  
  // 生产环境优化
  productionBrowserSourceMaps: false,
  
  // Webpack 配置
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Monaco Editor 配置
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'monaco-editor': path.resolve(__dirname, 'node_modules/monaco-editor'),
      };
    }
    
    // 生产环境优化
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // 将 Monaco Editor 单独打包
            monaco: {
              test: /[\\/]node_modules[\\/](monaco-editor|@monaco-editor)[\\/]/,
              name: 'monaco',
              priority: 10,
            },
            // 将 React 相关库打包在一起
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react',
              priority: 20,
            },
            // 其他 vendor
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Headers 配置 - 添加缓存
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
