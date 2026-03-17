-- Supabase 数据库表结构

-- 创建 users 表
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
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