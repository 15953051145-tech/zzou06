# ZL灵光 部署指南 - zzou60.cn

## 已完成的准备工作

- ✅ 项目已配置 Vercel 部署
- ✅ 构建验证通过
- ✅ Git 仓库已初始化并完成首次提交

---

## 部署步骤

### 1. 创建 GitHub 仓库并推送代码

1. 打开 [github.com/new](https://github.com/new) 创建新仓库
2. 仓库名可填 `zl-website` 或 `zzou60`，选择 **Public**
3. **不要**勾选 "Add a README"（仓库保持空）
4. 创建后，在本地项目目录执行：

```bash
cd "d:\软件\Corsor\自己的网站设计"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

### 2. 在 Vercel 部署

1. 打开 [vercel.com](https://vercel.com)，用 **GitHub 登录**
2. 点击 **Add New** → **Project**
3. 选择刚推送的仓库，点击 **Import**
4. 保持默认配置（Framework Preset: Vite 会自动识别）
5. 点击 **Deploy** 开始部署

部署完成后会得到 `xxx.vercel.app` 的临时地址。

### 3. 绑定域名 zzou60.cn

1. 在 Vercel 项目页，进入 **Settings** → **Domains**
2. 在输入框填入 `zzou60.cn`，点击 **Add**
3. 同时添加 `www.zzou60.cn`（可选）
4. 按 Vercel 提示，到域名服务商（阿里云/腾讯云等）添加 DNS 记录：

**根域名 zzou60.cn：**

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | @ | 76.76.21.21 |

**www 子域名（可选）：**

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| CNAME | www | cname.vercel-dns.com |

5. 保存后等待 DNS 生效（通常 5 分钟～2 小时）

### 4. 验证

- 访问 `https://zzou60.cn` 查看网站
- Vercel 会自动配置 HTTPS 证书

---

## 后续更新

修改代码后，执行：

```bash
git add .
git commit -m "更新说明"
git push
```

Vercel 会自动重新部署。
