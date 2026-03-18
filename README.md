# Sify Gist

一个类似于 GitHub Gist 的代码片段分享平台，完全托管在 Vercel 上。

## 功能特性

- ✅ 创建、查看和分享代码片段
- ✅ 语法高亮显示（支持 30+ 种编程语言）
- ✅ 响应式设计
- ✅ 深色模式支持（自动跟随系统偏好）
- ✅ 搜索功能
- ✅ 用户认证系统
- ✅ 版本控制和历史记录查看
- ✅ 代码编辑器（基于 Monaco Editor）
- ✅ Gist 编辑功能
- ✅ Gist 导出功能（ZIP 格式）
- ✅ API 接口
- ✅ 完整的 CRUD 操作
- ✅ 用户头像上传（支持自定义头像）
- ✅ Gist 收藏功能
- ✅ 密码修改功能（弹窗形式）
- ✅ 丰富的首页展示（统计信息、功能介绍）

## 技术栈

- [Next.js 14](https://nextjs.org/) - React 框架（App Router）
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Tailwind CSS](https://tailwindcss.com/) - 样式设计
- [Vercel](https://vercel.com/) - 部署平台
- [Prism.js](https://prismjs.com/) - 语法高亮
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [Supabase](https://supabase.com/) - 数据库
- [JSZip](https://stuk.github.io/jszip/) - ZIP 文件处理

## Supabase 数据库配置

本项目使用 Supabase 作为数据库解决方案，完美适应 Vercel 的无服务器环境。

### 设置 Supabase 项目

1. 访问 [Supabase](https://supabase.com/) 并创建一个新项目
2. 在项目设置中获取以下信息：
   - 项目 URL (NEXT_PUBLIC_SUPABASE_URL)
   - 服务角色密钥 (SUPABASE_SERVICE_ROLE_KEY)

### 创建数据库表

在 Supabase SQL 编辑器中运行以下脚本创建所需的表结构：

```sql
-- Supabase 数据库表结构

-- 创建 users 表
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建 gists 表
CREATE TABLE gists (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 创建 gist_files 表
CREATE TABLE gist_files (
    id SERIAL PRIMARY KEY,
    gist_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT DEFAULT 'text',
    FOREIGN KEY (gist_id) REFERENCES gists (id) ON DELETE CASCADE
);

-- 创建 gist_versions 表（用于版本控制）
CREATE TABLE gist_versions (
    id SERIAL PRIMARY KEY,
    gist_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gist_id) REFERENCES gists (id) ON DELETE CASCADE
);

-- 创建 gist_file_versions 表（存储每个文件的版本内容）
CREATE TABLE gist_file_versions (
    id SERIAL PRIMARY KEY,
    gist_version_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT DEFAULT 'text',
    FOREIGN KEY (gist_version_id) REFERENCES gist_versions (id) ON DELETE CASCADE
);

-- 创建 gist_stars 表（用于收藏功能）
CREATE TABLE gist_stars (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    gist_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (gist_id) REFERENCES gists (id) ON DELETE CASCADE,
    UNIQUE(user_id, gist_id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_gists_user_id ON gists(user_id);
CREATE INDEX idx_gist_files_gist_id ON gist_files(gist_id);
CREATE INDEX idx_gist_versions_gist_id ON gist_versions(gist_id);
CREATE INDEX idx_gist_file_versions_gist_version_id ON gist_file_versions(gist_version_id);
CREATE INDEX idx_gist_stars_user_id ON gist_stars(user_id);
CREATE INDEX idx_gist_stars_gist_id ON gist_stars(gist_id);
```

## 本地开发

1. 克隆项目:
```bash
git clone <your-repo-url>
cd sify-gist
```

2. 安装依赖:
```bash
npm install
```

3. 设置环境变量（在项目根目录创建 `.env.local` 文件）:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

4. 启动开发服务器:
```bash
npm run dev
```

5. 打开浏览器访问: [http://localhost:3000](http://localhost:3000)

## 编辑功能使用说明

- 登录后，在"我的 Gist"页面可以找到你创建的所有代码片段
- 点击"Gist"卡片上的编辑图标（铅笔图标）即可进入编辑页面
- 编辑页面会预加载现有 Gist 的内容，包括标题、描述、文件名和代码内容
- 修改完成后点击"更新 Gist"按钮保存更改
- 每次更新都会创建新的版本历史记录，之前的版本仍可访问

## 版本控制功能

- **自动版本记录**：每次更新 Gist 时自动创建新版本
- **版本查看**：在 Gist 详情页底部可查看所有历史版本
- **历史版本浏览**：点击版本号可查看该版本的代码内容
- **版本数据存储**：
  - 当前版本存储在 `gist_files` 表
  - 历史版本存储在 `gist_file_versions` 表

## 部署到 Vercel

你可以直接点击下面的按钮将项目部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/santisify/sify-gist)

或者手动部署:

1. 安装 Vercel CLI:
```bash
npm i -g vercel
```

2. 部署项目:
```bash
vercel --prod
```

### 部署注意事项

在将项目部署到 Vercel 时，请注意以下几点：

1. **环境变量设置**：
   - 在 Vercel 项目设置中配置必要的环境变量：
     - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL（必需）
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名密钥（必需）
     - `SUPABASE_SERVICE_ROLE_KEY`: Supabase 服务角色密钥（必需）

2. **数据库迁移**：
   - 确保 Supabase 数据库中已创建所有必需的表结构
   - 参考上面的 "Supabase 数据库配置" 部分执行数据库脚本

3. **用户认证安全**：
   - 当前实现使用 localStorage 存储用户 token，生产环境中建议使用更安全的认证机制
   - 考虑实现 JWT token 或服务器端会话管理以增强安全性

4. **密码修改功能**：
   - 密码修改功能通过 `/api/auth/change-password` 端点处理
   - 确保该端点在生产环境中正确验证用户身份

5. **用户头像功能**：
   - 支持用户上传自定义头像（JPG、PNG、GIF、WEBP 格式，最大 2MB）
   - 头像存储在 Supabase Storage 的 `avatars` 存储桶中
   - 需要在 Supabase 中创建 `avatars` 存储桶并设置为公开访问：
     ```sql
     -- 创建 avatars 存储桶（在 Supabase Dashboard -> Storage 中创建）
     -- 或使用 SQL:
     INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
     ```
   - 默认头像通过 Cravatar 服务显示（中国版的 Gravatar）

6. **错误处理**：
   - 确保生产环境中不会暴露敏感错误信息给客户端
   - 检查错误处理逻辑，确保不会在生产环境中泄露系统细节

7. **API 路由安全性**：
   - 检查所有 API 路由是否在生产环境中正确验证了用户权限
   - 确保敏感操作（如修改密码、删除 Gist 等）在生产环境中得到适当保护

## API 文档

完整的 API 文档可在应用内部访问：`/api-docs`

### 主要 API 端点

#### Gist 相关
- `GET /api/gists` - 获取所有 Gists
- `POST /api/gists` - 创建新 Gist
- `GET /api/gists/{id}` - 获取特定 Gist
- `PUT /api/gists/{id}` - 更新 Gist（编辑功能）
- `DELETE /api/gists/{id}` - 删除 Gist
- `GET /api/gists/{id}/versions` - 获取 Gist 版本历史
- `GET /api/gists/{id}/versions/{version}` - 获取特定版本内容
- `GET /api/gists/{id}/raw/{filename}` - 获取原始文件内容
- `GET /api/gists/{id}/export` - 导出 Gist 为 ZIP
- `POST /api/gists/{id}/star` - 收藏/取消收藏 Gist
- `GET /api/gists/starred` - 获取用户收藏的 Gists

#### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/change-password` - 用户修改密码
- `GET /api/auth/avatar` - 获取用户头像
- `POST /api/auth/avatar` - 上传用户头像
- `PUT /api/auth/avatar` - 更新用户头像

## 环境变量

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL（必需）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥（必需）
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务角色密钥（必需，用于服务端操作）

## 项目结构

```
sify-gist/
├── app/                 # Next.js 14 App Router 页面
│   ├── api/            # API 路由
│   │   ├── auth/       # 认证相关 API
│   │   │   ├── avatar/     # 头像上传
│   │   │   ├── change-password/  # 修改密码
│   │   │   ├── login/      # 登录
│   │   │   └── register/   # 注册
│   │   └── gists/      # Gist 相关 API
│   │       ├── [id]/       # Gist CRUD
│   │       │   ├── versions/   # 版本历史
│   │       │   ├── export/     # 导出 ZIP
│   │       │   └── star/       # 收藏
│   │       └── starred/    # 收藏列表
│   ├── create/         # 创建 Gist 页面
│   ├── gists/          # Gist 详情页面（包含版本历史）
│   │   └── [id]/       # Gist 详情、编辑和版本页面
│   │       ├── page.tsx        # Gist 查看页面
│   │       ├── page-client.tsx # Gist 查看页面客户端组件
│   │       ├── edit/           # Gist 编辑页面
│   │       └── versions/       # 版本历史页面
│   ├── login/          # 登录页面
│   ├── register/       # 注册页面
│   ├── search/         # 搜索页面
│   ├── profile/        # 个人中心页面
│   ├── api-docs/       # API 文档页面
│   ├── layout.tsx      # 根布局
│   ├── navbar.tsx      # 导航栏组件
│   ├── page.tsx        # 首页
│   ├── icon.svg        # 网站 favicon
│   └── apple-icon.svg  # Apple Touch 图标
├── components/         # React 组件
│   ├── AvatarUpload.tsx    # 头像上传组件
│   ├── CodeBlock.tsx       # 代码块组件
│   ├── GistActions.tsx     # Gist 操作组件
│   ├── GistDisplay.tsx     # Gist 显示组件
│   ├── GistVersions.tsx    # 版本列表组件
│   ├── ProtectedRoute.tsx  # 路由保护组件
│   └── ThemeToggle.tsx     # 主题切换组件
├── lib/               # 工具函数和数据处理
│   ├── db.ts          # 数据库连接
│   ├── supabase.ts    # Supabase 客户端配置
│   ├── supabase-server.ts # 服务端 Supabase 客户端
│   ├── gists.ts       # Gist 相关操作
│   ├── auth.ts        # 认证相关操作
│   ├── avatar.ts      # 头像上传操作
│   └── language-support.ts # 语言支持
├── public/            # 静态资源
│   ├── favicon.svg    # 网站图标
│   └── apple-touch-icon.svg # Apple Touch 图标
├── styles/            # 全局样式
│   └── globals.css    # 全局 CSS
├── package.json
├── next.config.js
├── tailwind.config.js
├── vercel.json        # Vercel 配置
└── README.md
```

## 许可证

MIT