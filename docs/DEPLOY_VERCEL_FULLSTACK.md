# VanceFeedback Vercel 全栈部署教程

本教程将指导您如何将 VanceFeedback 的**前端和后端**同时部署到 Vercel。

## 📋 目录

- [部署架构](#部署架构)
- [前置准备](#前置准备)
- [数据库配置](#数据库配置)
- [Vercel 部署步骤](#vercel-部署步骤)
- [环境变量配置](#环境变量配置)
- [验证部署](#验证部署)
- [常见问题](#常见问题)
- [部署方式对比](#部署方式对比)

---

## 🏗️ 部署架构

```
┌─────────────────────────────────────────────┐
│          Vercel (全球 CDN)                    │
│                                             │
│  ┌─────────────┐      ┌──────────────────┐ │
│  │  前端 SPA    │      │  后端 Serverless  │ │
│  │  (静态文件)  │◄────►│  Functions       │ │
│  └─────────────┘      └──────────────────┘ │
│                              │              │
└──────────────────────────────┼──────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   外部数据库          │
                    │   (MySQL/PostgreSQL) │
                    └──────────────────────┘
```

**优势：**
- ✅ 前后端均享受 Vercel 全球 CDN 加速
- ✅ 自动 HTTPS 和免费 SSL 证书
- ✅ 一键部署，Git 推送自动部署
- ✅ 零服务器管理，按需扩容
- ✅ 无需配置反向代理

**限制：**
- ⚠️ **必须使用外部数据库**（不支持 SQLite）
- ⚠️ Serverless 函数有执行时间限制（Hobby: 10s, Pro: 60s）
- ⚠️ 冷启动可能导致首次请求较慢

---

## 💻 前置准备

### 必需条件

1. **GitHub/GitLab/Bitbucket 账号**
   - 用于托管代码仓库

2. **Vercel 账号**（免费）
   - 访问 [vercel.com](https://vercel.com) 注册
   - 建议使用 GitHub 账号登录

3. **外部数据库**（必须）
   - Vercel Postgres（推荐，集成简单）
   - Railway MySQL/PostgreSQL
   - PlanetScale MySQL
   - Supabase PostgreSQL
   - 任何可公网访问的 MySQL/PostgreSQL 服务器

### 环境检查

```bash
# 确保已安装 Node.js 和 npm
node --version  # 应为 v16 或更高
npm --version   # 应为 v7 或更高

# 确保已安装 Git
git --version
```

---

## 🗄️ 数据库配置

Vercel Serverless Functions **不支持 SQLite**，必须使用外部数据库。

### 方案 1：Vercel Postgres（推荐）

#### 1. 在 Vercel 项目中创建数据库

1. 登录 Vercel Dashboard
2. 选择你的项目
3. 点击 **"Storage"** 标签
4. 点击 **"Create Database"** → 选择 **"Postgres"**
5. 输入数据库名称，选择区域（建议选择离用户最近的区域）
6. 点击 **"Create"**

#### 2. 获取连接信息

创建后，Vercel 会自动提供以下环境变量：
- `POSTGRES_HOST`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

这些变量会自动注入到你的项目中。

#### 3. 配置环境变量映射

在 Vercel 项目设置中，添加以下环境变量（将 Vercel Postgres 的变量映射到应用需要的变量）：

| 变量名 | 值 |
|--------|-----|
| `DB_TYPE` | `mysql` |
| `DB_HOST` | `${POSTGRES_HOST}` |
| `DB_PORT` | `5432` |
| `DB_USER` | `${POSTGRES_USER}` |
| `DB_PASSWORD` | `${POSTGRES_PASSWORD}` |
| `DB_NAME` | `${POSTGRES_DATABASE}` |

> **注意**：虽然变量名是 `POSTGRES_*`，但我们的应用需要 `DB_*` 格式。

### 方案 2：Railway（推荐，免费额度）

#### 1. 创建 Railway 数据库

```bash
# 访问 railway.app 创建账号
# 1. 新建项目
# 2. 选择 "Provision PostgreSQL" 或 "Provision MySQL"
# 3. 获取连接信息
```

#### 2. 获取连接信息

Railway 会提供：
- `MYSQLHOST` / `PGHOST`
- `MYSQLUSER` / `PGUSER`
- `MYSQLPASSWORD` / `PGPASSWORD`
- `MYSQLDATABASE` / `PGDATABASE`
- `MYSQLPORT` / `PGPORT`

### 方案 3：Supabase（PostgreSQL）

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 在 **Settings → Database** 获取连接信息
4. 使用 Connection Pooling 地址（性能更好）

### 方案 4：自建 MySQL/PostgreSQL

如果你有自己的服务器：

```bash
# 确保数据库允许外网访问
# 配置防火墙允许来自任何 IP 的连接（生产环境建议限制为 Vercel IP 范围）

# MySQL 示例
mysql> CREATE DATABASE vancefeedback;
mysql> CREATE USER 'vance'@'%' IDENTIFIED BY 'your_strong_password';
mysql> GRANT ALL PRIVILEGES ON vancefeedback.* TO 'vance'@'%';
mysql> FLUSH PRIVILEGES;
```

---

## 🚀 Vercel 部署步骤

### 步骤 1：准备代码仓库

#### 1.1 推送代码到 GitHub

```bash
# 在本地项目目录
git init
git add .
git commit -m "Prepare for Vercel deployment"
git branch -M main
git remote add origin https://github.com/your-username/VanceFeedback.git
git push -u origin main
```

### 步骤 2：在 Vercel 创建项目

#### 2.1 导入 Git 仓库

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 **"Add New..."** → **"Project"**
3. 选择你的 GitHub 仓库（`VanceFeedback`）
4. 点击 **"Import"**

#### 2.2 配置项目

Vercel 会自动检测到这是一个 Vite 项目：

- **Framework Preset**: Vite
- **Root Directory**: `./`（保持默认）
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**暂时不要点击 Deploy**，先配置环境变量。

### 步骤 3：配置环境变量

这是**最关键**的步骤！

#### 3.1 在 Vercel 项目设置中添加环境变量

1. 在项目配置页面，点击 **"Environment Variables"** 部分
2. 添加以下**必需**的环境变量：

##### 数据库配置（必需）

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DB_TYPE` | `mysql` | 数据库类型（使用 `mysql` 即使是 PostgreSQL） |
| `DB_HOST` | `your-db-host.com` | 数据库主机地址 |
| `DB_PORT` | `3306` / `5432` | MySQL: 3306, PostgreSQL: 5432 |
| `DB_USER` | `your_db_user` | 数据库用户名 |
| `DB_PASSWORD` | `your_db_password` | 数据库密码 |
| `DB_NAME` | `vancefeedback` | 数据库名称 |

##### 可选配置

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ADMIN_USER` | `admin` | 首次部署时自动创建的管理员账号 |
| `ADMIN_PASS` | `your_admin_password` | 首次部署时的管理员密码 |
| `GEMINI_API_KEY` | `your_gemini_key` | Google Gemini AI 密钥（用于 AI 功能） |

#### 3.2 应用到所有环境

确保环境变量应用到：
- ☑️ Production
- ☑️ Preview
- ☑️ Development

### 步骤 4：部署

#### 4.1 触发部署

点击 **"Deploy"** 按钮，Vercel 会自动：

1. 从 GitHub 拉取代码
2. 安装依赖（`npm install`）
3. 构建前端（`npm run build`）
4. 部署前端到 CDN
5. 部署后端为 Serverless Functions

部署通常需要 2-5 分钟。

#### 4.2 查看部署状态

在 **"Deployments"** 标签可以查看部署进度和日志。

- ✅ **Building**：正在构建前端
- ✅ **Deploying**：正在部署
- ✅ **Ready**：部署成功

### 步骤 5：访问应用

部署成功后，Vercel 会分配一个域名，例如：
```
https://vance-feedback-abc123.vercel.app
```

点击链接即可访问你的应用！

---

## 🔑 环境变量配置详解

### 必需环境变量

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `DB_TYPE` | ✅ | 数据库类型 | `mysql` |
| `DB_HOST` | ✅ | 数据库主机 | `db.railway.app` |
| `DB_PORT` | ✅ | 数据库端口 | `3306` (MySQL) / `5432` (PostgreSQL) |
| `DB_USER` | ✅ | 数据库用户 | `root` |
| `DB_PASSWORD` | ✅ | 数据库密码 | `your_password` |
| `DB_NAME` | ✅ | 数据库名称 | `vancefeedback` |

### 可选环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `ADMIN_USER` | - | 首次部署自动创建的管理员账号 |
| `ADMIN_PASS` | - | 首次部署的管理员密码 |
| `GEMINI_API_KEY` | - | Google Gemini API 密钥（AI 功能） |
| `PORT` | `3000` | 端口号（Vercel 会自动设置，无需配置） |

### 环境变量配置示例

#### 使用 Railway MySQL

```env
DB_TYPE=mysql
DB_HOST=containers-us-west-123.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=abc123xyz456
DB_NAME=railway
ADMIN_USER=admin
ADMIN_PASS=Admin@123456
```

#### 使用 Vercel Postgres

```env
DB_TYPE=mysql
DB_HOST=${POSTGRES_HOST}
DB_PORT=5432
DB_USER=${POSTGRES_USER}
DB_PASSWORD=${POSTGRES_PASSWORD}
DB_NAME=${POSTGRES_DATABASE}
ADMIN_USER=admin
ADMIN_PASS=Admin@123456
```

---

## ✅ 验证部署

### 1. 访问首页

打开 Vercel 提供的域名（如 `https://your-app.vercel.app`），应该看到：

- ✅ 登录页面正常显示
- ✅ 样式加载正常
- ✅ 无控制台错误

### 2. 测试 API

打开浏览器开发者工具（F12），访问 API 状态端点：

```
https://your-app.vercel.app/api/status
```

应该返回：
```json
{
  "configured": true,
  "publicKey": "-----BEGIN PUBLIC KEY-----..."
}
```

### 3. 测试登录

如果配置了 `ADMIN_USER` 和 `ADMIN_PASS`：

1. 使用配置的账号密码登录
2. 访问管理后台
3. 测试创建工单、用户管理等功能

### 4. 检查数据库

使用数据库管理工具（如 Navicat、DBeaver）连接数据库，确认：

- ✅ 表已自动创建
- ✅ 管理员账号已创建（如果配置了 `ADMIN_USER`）
- ✅ 数据正确写入

---

## 🌐 自定义域名

### 添加自定义域名

1. 在 Vercel 项目设置中，点击 **"Domains"**
2. 输入你的域名（例如 `feedback.yourdomain.com`）
3. 点击 **"Add"**

### 配置 DNS

根据 Vercel 提示，在你的域名管理后台添加：

**CNAME 记录（推荐）**
```
Type: CNAME
Name: feedback
Value: cname.vercel-dns.com
```

**A 记录**
```
Type: A
Name: feedback
Value: 76.76.21.21
```

### 等待生效

- DNS 生效通常需要 5-60 分钟
- Vercel 会自动配置 SSL 证书
- 访问你的自定义域名验证

---

## 🔄 自动部署

### Git 自动部署

配置完成后，每次推送代码都会自动触发部署：

```bash
# 修改代码后
git add .
git commit -m "Update features"
git push

# Vercel 会自动检测并重新部署
```

### 部署环境

- **Production**：推送到 `main` / `master` 分支
- **Preview**：推送到其他分支或创建 Pull Request

---

## 🐛 常见问题

### 1. 部署成功但 API 无法访问

**症状**：前端加载正常，但显示"网络错误"或 500 错误。

**解决方案**：

1. **检查环境变量**
   - 确认所有 `DB_*` 环境变量都已正确配置
   - 变量名必须完全匹配（区分大小写）

2. **检查数据库连接**
   - 确认数据库允许外网访问
   - 测试数据库连接字符串是否正确
   - 检查防火墙规则

3. **查看 Vercel 日志**
   - 进入 **Deployments** → 点击最新部署 → **"Functions"** 标签
   - 查看 `/api` 函数的日志
   - 寻找错误信息（如 "Database connection failed"）

### 2. 数据库连接超时

**症状**：API 请求返回 504 Gateway Timeout

**解决方案**：

1. **使用连接池地址**
   - Supabase: 使用 Connection Pooling 地址
   - PlanetScale: 确保已启用

2. **优化数据库位置**
   - 将数据库部署在离 Vercel 函数最近的区域
   - Vercel 函数默认部署在 US East（可在设置中更改）

3. **增加超时时间**
   - Vercel Pro 用户可以增加函数执行时间限制

### 3. "System not configured" 错误

**症状**：访问 `/api/status` 返回 `configured: false`

**解决方案**：

1. **环境变量未生效**
   - 修改环境变量后，必须重新部署
   - **Deployments** → 选择最新部署 → **"Redeploy"**

2. **数据库配置文件问题**
   - Vercel 部署不使用本地 `server/config/db_config.json`
   - 必须通过环境变量配置

### 4. 冷启动延迟

**症状**：长时间无访问后，首次请求很慢

**解决方案**：

这是 Serverless 的正常行为，可以：
- 升级到 Vercel Pro（减少冷启动时间）
- 使用 Uptime 监控工具定期 ping API 保持活跃
- 优化依赖大小，减少函数冷启动时间

### 5. SQLite 相关错误

**症状**：日志显示 "SQLITE_ERROR" 或 "no such table"

**原因**：Vercel Serverless 不支持 SQLite

**解决方案**：
- **必须使用 MySQL/PostgreSQL**
- 确保 `DB_TYPE` 设置为 `mysql`
- 检查数据库连接配置

### 6. 首次部署数据库表未创建

**症状**：登录时显示 "table doesn't exist"

**解决方案**：

1. **配置管理员账号**
   - 设置 `ADMIN_USER` 和 `ADMIN_PASS` 环境变量
   - 重新部署
   - 这会触发数据库初始化

2. **手动运行迁移**
   - 如果问题仍存在，可能需要手动创建表
   - 查看 `server/installer.js` 中的 SQL 语句
   - 在数据库管理工具中手动执行

---

## 📊 部署方式对比

| 特性 | Vercel 全栈部署 | Vercel 前端 + VPS 后端 | Docker 全栈部署 |
|------|----------------|----------------------|----------------|
| **前端托管** | Vercel (全球 CDN) | Vercel (全球 CDN) | 自建服务器 |
| **后端托管** | Vercel Serverless | 自建 VPS/Docker | 自建服务器 |
| **前端性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **后端性能** | ⭐⭐⭐⭐ (冷启动) | ⭐⭐⭐⭐⭐ (持续运行) | ⭐⭐⭐⭐⭐ |
| **数据库** | ❌ 不支持 SQLite<br>✅ 必须外部数据库 | ✅ 支持 SQLite<br>✅ 支持 MySQL | ✅ 支持 SQLite<br>✅ 支持 MySQL |
| **部署难度** | ⭐⭐ 简单 | ⭐⭐⭐ 中等 | ⭐⭐⭐ 中等 |
| **成本** | 免费额度<br>超量按需付费 | 前端免费<br>后端需 VPS | 需要服务器 |
| **扩容** | ⭐⭐⭐⭐⭐ 自动 | ⭐⭐⭐ 手动 | ⭐⭐⭐ 手动 |
| **HTTPS** | ⭐⭐⭐⭐⭐ 自动 | ⭐⭐⭐⭐⭐ 前端自动<br>⭐⭐⭐ 后端手动 | ⭐⭐⭐ 手动 |
| **CI/CD** | ⭐⭐⭐⭐⭐ Git 自动 | ⭐⭐⭐⭐⭐ 前端自动<br>⭐⭐⭐ 后端手动 | ⭐⭐⭐ 手动 |
| **适用场景** | 快速上线<br>无服务器管理 | 追求后端性能<br>使用 SQLite | 完全自主控制<br>内网部署 |

### 什么时候使用 Vercel 全栈部署？

✅ **推荐使用**：
- 快速上线，无需管理服务器
- 流量不确定，需要自动扩容
- 已有外部数据库服务
- 追求全球 CDN 加速
- 需要自动化 CI/CD

❌ **不推荐使用**：
- 想使用 SQLite 数据库
- 需要长时间运行的后台任务
- 对冷启动延迟敏感
- 完全内网部署（无公网访问）

---

## 📚 相关资源

### 相关部署文档

- [Vercel 前端 + VPS 后端部署教程](./DEPLOY_VERCEL.md)
- [Docker 全栈部署教程](./DOCKER_DEPLOY.md)
- [Docker 分离部署教程](./DEPLOY_SEPARATED.md)

### 推荐数据库服务

- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) - 官方整合，最简单
- [Railway](https://railway.app) - 免费额度，支持 MySQL/PostgreSQL
- [PlanetScale](https://planetscale.com) - Serverless MySQL
- [Supabase](https://supabase.com) - 开源 Firebase 替代品，PostgreSQL

### Vercel 相关文档

- [Vercel 官方文档](https://vercel.com/docs)
- [Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [环境变量配置](https://vercel.com/docs/concepts/projects/environment-variables)

---

**祝您部署顺利！** 🎉

如果遇到问题：
1. 查看本文档的 [常见问题](#常见问题) 章节
2. 检查 Vercel Deployment 日志
3. 查看浏览器控制台（F12）的错误信息
4. 提交 Issue 到项目仓库

如果本教程对您有帮助，请给项目点个 Star ⭐
