-- Supabase 数据库表结构

-- 创建 users 表
CREATE TABLE users
(
    id                   TEXT PRIMARY KEY,
    name                 TEXT        NOT NULL,
    username_normalized  TEXT UNIQUE NOT NULL, -- 用于大小写不敏感查询
    email                TEXT UNIQUE NOT NULL,
    password_hash        TEXT,                    -- 可为空，OAuth 用户没有密码
    avatar_url           TEXT,
    github_id            TEXT UNIQUE, -- GitHub OAuth 用户 ID
    gitlab_id            TEXT UNIQUE, -- GitLab OAuth 用户 ID
    gitea_id             TEXT UNIQUE, -- Gitea OAuth 用户 ID
    oidc_id              TEXT UNIQUE, -- OIDC OAuth 用户 ID
    md5_hash             TEXT,        -- 用于 Gravatar 头像
    style_preferences    JSONB,       -- 用户偏好设置（主题、编辑器设置等）
    is_admin             BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_username_normalized ON users (username_normalized);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_github_id ON users (github_id);
CREATE INDEX idx_users_gitlab_id ON users (gitlab_id);
CREATE INDEX idx_users_gitea_id ON users (gitea_id);
CREATE INDEX idx_users_oidc_id ON users (oidc_id);

-- 创建 gists 表
CREATE TABLE gists
(
    id                 TEXT PRIMARY KEY,
    uuid               TEXT UNIQUE NOT NULL,        -- 唯一标识符
    user_id            TEXT,
    title              TEXT,
    description        TEXT,
    url                TEXT,                        -- 自定义 URL
    url_normalized     TEXT,                        -- 规范化的 URL（小写）
    preview            TEXT,                        -- 预览内容
    preview_filename   TEXT,                        -- 预览文件名
    preview_mime_type  TEXT,                        -- 预览文件 MIME 类型
    visibility         INTEGER DEFAULT 0,           -- 0: public, 1: unlisted, 2: private
    forked_id          TEXT,                        -- Fork 来源 gist ID
    nb_files           INTEGER DEFAULT 0,           -- 文件数量
    nb_likes           INTEGER DEFAULT 0,           -- 收藏数
    nb_forks           INTEGER DEFAULT 0,           -- Fork 数
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (forked_id) REFERENCES gists (id) ON DELETE SET NULL
);

-- 创建 gist_files 表
CREATE TABLE gist_files
(
    id       SERIAL PRIMARY KEY,
    gist_id  TEXT NOT NULL,
    filename TEXT NOT NULL,
    content  TEXT NOT NULL,
    language TEXT DEFAULT 'text',
    FOREIGN KEY (gist_id) REFERENCES gists (id) ON DELETE CASCADE
);

-- 创建 gist_versions 表（用于版本控制）
CREATE TABLE gist_versions
(
    id             SERIAL PRIMARY KEY,
    gist_id        TEXT    NOT NULL,
    version_number INTEGER NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gist_id) REFERENCES gists (id) ON DELETE CASCADE
);

-- 创建 gist_file_versions 表（存储每个文件的版本内容）
CREATE TABLE gist_file_versions
(
    id              SERIAL PRIMARY KEY,
    gist_version_id INTEGER NOT NULL,
    filename        TEXT    NOT NULL,
    content         TEXT    NOT NULL,
    language        TEXT DEFAULT 'text',
    FOREIGN KEY (gist_version_id) REFERENCES gist_versions (id) ON DELETE CASCADE
);

-- 创建 likes 表（用于收藏功能）
CREATE TABLE likes
(
    user_id    TEXT NOT NULL,
    gist_id    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, gist_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (gist_id) REFERENCES gists (id) ON DELETE CASCADE
);

-- 创建 gist_topics 表（用于标签功能）
CREATE TABLE gist_topics
(
    gist_id TEXT NOT NULL,
    topic   TEXT NOT NULL,
    PRIMARY KEY (gist_id, topic),
    FOREIGN KEY (gist_id) REFERENCES gists (id) ON DELETE CASCADE
);

-- 创建 gist_languages 表（用于编程语言标签）
CREATE TABLE gist_languages
(
    gist_id   TEXT NOT NULL,
    language  TEXT NOT NULL,
    PRIMARY KEY (gist_id, language),
    FOREIGN KEY (gist_id) REFERENCES gists (id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX idx_gists_user_id ON gists (user_id);
CREATE INDEX idx_gists_uuid ON gists (uuid);
CREATE INDEX idx_gists_url_normalized ON gists (url_normalized);
CREATE INDEX idx_gists_forked_id ON gists (forked_id);
CREATE INDEX idx_gists_visibility ON gists (visibility);
CREATE INDEX idx_gists_created_at ON gists (created_at);
CREATE INDEX idx_gists_updated_at ON gists (updated_at);
CREATE INDEX idx_gist_files_gist_id ON gist_files (gist_id);
CREATE INDEX idx_gist_versions_gist_id ON gist_versions (gist_id);
CREATE INDEX idx_gist_file_versions_gist_version_id ON gist_file_versions (gist_version_id);
CREATE INDEX idx_likes_user_id ON likes (user_id);
CREATE INDEX idx_likes_gist_id ON likes (gist_id);
CREATE INDEX idx_gist_topics_gist_id ON gist_topics (gist_id);
CREATE INDEX idx_gist_topics_topic ON gist_topics (topic);
CREATE INDEX idx_gist_languages_gist_id ON gist_languages (gist_id);
CREATE INDEX idx_gist_languages_language ON gist_languages (language);

-- 创建 access_tokens 表（用于 API 访问令牌管理）
CREATE TABLE access_tokens
(
    id          SERIAL PRIMARY KEY,
    name        TEXT    NOT NULL,
    token_hash  TEXT UNIQUE NOT NULL,  -- SHA-256 哈希值
    user_id     TEXT    NOT NULL,
    scope_gist  INTEGER DEFAULT 0,     -- 0: none, 1: read, 2: read+write
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at  TIMESTAMP,            -- NULL 表示永不过期
    last_used_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_access_tokens_token_hash ON access_tokens (token_hash);
CREATE INDEX idx_access_tokens_user_id ON access_tokens (user_id);

-- 创建 ssh_keys 表（用于 SSH 密钥管理）
CREATE TABLE ssh_keys
(
    id          SERIAL PRIMARY KEY,
    title       TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    sha         TEXT    NOT NULL,
    user_id     TEXT    NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE (content)
);

CREATE INDEX idx_ssh_keys_user_id ON ssh_keys (user_id);
CREATE INDEX idx_ssh_keys_sha ON ssh_keys (sha);

-- 创建 admin_settings 表（用于管理员配置）
CREATE TABLE admin_settings
(
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 插入默认管理员设置
INSERT INTO admin_settings (key, value) VALUES
    ('disable-signup', '0'),
    ('require-login', '0'),
    ('allow-gists-without-login', '0'),
    ('disable-login-form', '0'),
    ('disable-gravatar', '0')
ON CONFLICT (key) DO NOTHING;

-- 创建 invitations 表（用于邀请码系统）
CREATE TABLE invitations
(
    id         SERIAL PRIMARY KEY,
    code       TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    nb_used    INTEGER DEFAULT 0,
    nb_max     INTEGER DEFAULT 0     -- 0 表示无限制
);

CREATE INDEX idx_invitations_code ON invitations (code);

-- 创建 gist_init_queue 表（用于 Gist 初始化队列）
CREATE TABLE gist_init_queue
(
    id        SERIAL PRIMARY KEY,
    gist_id   TEXT    NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gist_id) REFERENCES gists (id) ON DELETE CASCADE
);

CREATE INDEX idx_gist_init_queue_gist_id ON gist_init_queue (gist_id);