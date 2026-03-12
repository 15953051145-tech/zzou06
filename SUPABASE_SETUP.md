# Supabase 接入说明

- ✅ 已添加 Supabase SDK 和存储适配层
- ✅ 支持自定义域名（无免费版限制）
- 未配置时自动使用 localStorage，数据仅保存在本地

## 1. 创建 Supabase 项目

1. 打开 [Supabase](https://supabase.com) 并登录
2. 点击 **New Project**，填写项目名称和数据库密码
3. 创建完成后，进入 **Settings** → **API**，复制：
   - **Project URL** → 填入 `supabase-config.js` 的 `SUPABASE_URL`
   - **anon public** key → 填入 `SUPABASE_ANON_KEY`

## 2. 创建数据表

在 Supabase 控制台进入 **SQL Editor**，执行：

```sql
-- 创建 zl_data 表，用于存储随记、图库、项目、留言、短视频账号
CREATE TABLE IF NOT EXISTS zl_data (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 允许匿名读写（适合个人站点，如需限制可后续配置 RLS）
ALTER TABLE zl_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON zl_data
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON zl_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON zl_data
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON zl_data
  FOR DELETE USING (true);
```

## 3. 配置站点

编辑 `public/supabase-config.js`（或根目录的 `supabase-config.js`），填入：

```javascript
window.SUPABASE_URL = "https://你的项目.supabase.co";
window.SUPABASE_ANON_KEY = "你的 anon key";
```

## 4. 部署

推送代码到 GitHub，Vercel 会自动重新部署。Supabase 支持任意域名访问，无需配置白名单。

## 数据键说明

| key | 用途 |
|-----|------|
| zl_notes_data_v1 | 随记 |
| zl_gallery_data_v1 | 图库相册 |
| zl_projects_data_v1 | 项目 |
| zl_messages_data_v1 | 留言 |
| zl_shortvideo_accounts_v1 | 短视频账号 |
