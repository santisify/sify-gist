// next.config.js
/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  trailingSlash: true, // Generate trailing slashes for cleaner URLs
  experimental: {
    serverComponentsExternalPackages: ['prismjs'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // 为 Monaco Editor 配置别名，指向本地版本
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'monaco-editor': path.resolve(__dirname, 'node_modules/monaco-editor'),
      };
    }
    
    return config;
  }
}

module.exports = nextConfig