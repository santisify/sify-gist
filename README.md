# Sify Gist

一个类似于 GitHub Gist 的代码片段分享平台，完全托管在 Vercel 上。

> 💡 **Inspired by [OpenGist](https://github.com/thomiceli/opengist)** - 本项目受到 OpenGist 的启发，致力于提供一个现代化的、易于部署的代码片段分享解决方案。

## 功能特性

### 核心功能
- ✅ 创建、查看和分享代码片段
- ✅ 公开/未列出/私有三种可见性设置
- ✅ 语法高亮显示（支持 34+ 种编程语言）
- ✅ 响应式设计
- ✅ 深色模式支持（自动跟随系统偏好）
- ✅ 搜索功能（支持标题、描述、文件名、代码内容）

### 用户系统
- ✅ 用户注册与登录
- ✅ 用户头像上传（支持自定义头像）
- ✅ 密码修改功能
- ✅ 个人主页

### Gist 管理
- ✅ 完整的 CRUD 操作
- ✅ 版本控制和历史记录查看
- ✅ Gist 编辑功能
- ✅ Gist 导出功能（ZIP 格式）
- ✅ Gist 收藏功能
- ✅ **Fork 功能** - 复制他人 Gist 到自己账户
- ✅ **Topics/标签** - 为 Gist 添加标签分类

### 协作与分享
- ✅ **Embed JS** - 支持在其他网站嵌入 Gist
- ✅ Raw 文件访问
- ✅ 用户公开主页 - 查看用户的所有公开 Gist
- ✅ **发现页面** - 浏览公开 Gist 和热门标签

### 编辑器增强
- ✅ Monaco Editor 代码编辑器
- ✅ 自动语言检测（根据文件扩展名）
- ✅ **Markdown 预览** - 实时预览 Markdown 文件
- ✅ **CSV 预览** - 表格形式预览 CSV 文件

### 其他
- ✅ API 接口
- ✅ 丰富的首页展示（统计信息、功能介绍）
- ✅ 分页组件

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
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
    forked_from TEXT,
    stars_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
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

-- 创建 gist_topics 表（用于标签功能）
CREATE TABLE gist_topics (
    id SERIAL PRIMARY KEY,
    gist_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gist_id) REFERENCES gists (id) ON DELETE CASCADE,
    UNIQUE(gist_id, topic)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_gists_user_id ON gists(user_id);
CREATE INDEX idx_gists_forked_from ON gists(forked_from);
CREATE INDEX idx_gist_files_gist_id ON gist_files(gist_id);
CREATE INDEX idx_gist_versions_gist_id ON gist_versions(gist_id);
CREATE INDEX idx_gist_file_versions_gist_version_id ON gist_file_versions(gist_version_id);
CREATE INDEX idx_gist_stars_user_id ON gist_stars(user_id);
CREATE INDEX idx_gist_stars_gist_id ON gist_stars(gist_id);
CREATE INDEX idx_gist_topics_gist_id ON gist_topics(gist_id);
CREATE INDEX idx_gist_topics_topic ON gist_topics(topic);
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
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL（必需）
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名密钥（必需）
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase 服务角色密钥（必需）

2. **数据库迁移**：确保 Supabase 数据库中已创建所有必需的表结构

3. **用户头像功能**：需要在 Supabase 中创建 `avatars` 存储桶并设置为公开访问

4. **默认头像**：通过 Cravatar 服务显示（中国版的 Gravatar）

## API 文档

完整的 API 文档可在应用内部访问：`/api-docs`

### 主要 API 端点

#### Gist 相关
- `GET /api/gists` - 获取所有 Gists（支持分页和标签筛选）
- `POST /api/gists` - 创建新 Gist
- `GET /api/gists/{id}` - 获取特定 Gist
- `PUT /api/gists/{id}` - 更新 Gist
- `DELETE /api/gists/{id}` - 删除 Gist
- `POST /api/gists/{id}/fork` - Fork Gist
- `GET /api/gists/{id}/forks` - 获取 Fork 列表
- `GET /api/gists/{id}/versions` - 获取 Gist 版本历史
- `GET /api/gists/{id}/versions/{version}` - 获取特定版本内容
- `GET /api/gists/{id}/raw/{filename}` - 获取原始文件内容
- `GET /api/gists/{id}/export` - 导出 Gist 为 ZIP
- `GET /api/gists/{id}/embed.js` - 获取 Embed JS 脚本
- `POST /api/gists/{id}/star` - 收藏 Gist
- `DELETE /api/gists/{id}/star` - 取消收藏
- `GET /api/gists/starred` - 获取用户收藏的 Gists

#### Topics 相关
- `GET /api/topics` - 获取所有标签

#### 用户相关
- `GET /api/users/{id}` - 获取用户信息

#### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/change-password` - 用户修改密码
- `GET /api/auth/avatar` - 获取用户头像
- `POST /api/auth/avatar` - 上传用户头像

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
│   │   ├── gists/      # Gist 相关 API
│   │   ├── topics/     # 标签 API
│   │   └── users/      # 用户 API
│   ├── create/         # 创建 Gist 页面
│   ├── discover/       # 发现页面
│   ├── gists/          # Gist 详情页面
│   ├── login/          # 登录页面
│   ├── profile/        # 个人中心页面
│   ├── register/       # 注册页面
│   ├── search/         # 搜索页面
│   └── users/          # 用户公开主页
├── components/         # React 组件
├── lib/               # 工具函数和数据处理
├── public/            # 静态资源
└── styles/            # 全局样式
```

## 致谢

本项目受到 [OpenGist](https://github.com/thomiceli/opengist) 的启发。OpenGist 是一个优秀的自托管 Pastebin 解决方案，使用 Git 驱动，支持多种功能特性。

如果你需要一个更完整的、支持 Git 同步和 OAuth 登录的自托管解决方案，推荐使用 [OpenGist](https://github.com/thomiceli/opengist)。

## 许可证

MIT
