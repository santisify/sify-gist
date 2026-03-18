# Supabase 头像存储配置指南

要在Sify Gist中启用头像上传功能，您需要在Supabase项目中配置头像存储桶。

## 1. 环境变量配置

首先确保您的环境变量已正确配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # 用于服务器端操作
```

## 2. 创建存储桶

在Supabase仪表板中：

1. 转到 "Storage" 部分
2. 点击 "Buckets" 选项卡
3. 点击 "New bucket"
4. 输入桶名称：`avatars`
5. 设置公开访问：启用（或根据安全需求配置策略）
6. 点击 "Create bucket"

## 3. 配置存储桶策略

为avatars桶配置适当的访问策略：

### 读取策略
```sql
-- 允许读取所有头像文件
CREATE POLICY "Allow read access for avatars" ON storage.objects
FOR SELECT TO authenticated, anon
USING (bucket_id = 'avatars');
```

### 插入策略
```sql
-- 允许用户上传自己的头像
CREATE POLICY "Allow insert access for avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 允许用户更新自己的头像
CREATE POLICY "Allow update access for avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 删除策略
```sql
-- 允许用户删除自己的头像
CREATE POLICY "Allow delete access for avatars" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## 4. 项目设置验证

要验证头像上传功能是否正常工作，请执行以下步骤：

1. 登录到您的Sify Gist应用
2. 访问个人资料页面
3. 点击头像上传按钮
4. 选择一张图片文件
5. 确认头像已成功上传并在页面上显示

## 5. 故障排除

如果头像上传功能无法正常工作，请检查：

1. 确认`avatars`桶已正确创建
2. 确认数据库中的`users`表包含`avatar_url`字段
3. 检查Supabase存储策略是否正确设置
4. 验证环境变量配置
5. 确认Supabase JavaScript客户端初始化正确
6. 如果遇到"Invalid Compact JWS"错误，确保客户端使用正确的认证令牌