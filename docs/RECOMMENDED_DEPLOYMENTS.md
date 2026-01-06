# VanceFeedback 部署方案推荐指南

本指南根据不同的硬件资源、技术熟练度和场景，为您推荐最适合 VanceFeedback 的部署方案。

---

## 🚀 方案对比一览

| 部署方案 | 适合人群 | 核心优势 | 数据库支持 | 成本 | 复杂度 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Docker (全栈)** | VPS/主路器用户 | 极简启动，数据可控 | SQLite / MySQL | 低 (VPS 成本) | ⭐⭐ |
| **Vercel (Serverless)** | 开发者 | 极速上线，全球加速 | 需外部 MySQL | 免费 / 极低 | ⭐⭐ |
| **Cloudflare (Pages)** | 极客 / 追求性能 | 边缘节点计算，高并发 | 需外部 MySQL | 免费 | ⭐⭐⭐ |
| **Railway / Zeabur** | 追求便捷 | 一键部署，自动管理数据库 | MySQL | 按需付费/免费额度 | ⭐ |

---

## 🛠️ 方案详情

### 1. Docker 全栈部署 (推荐 - 企业/私有化)
将前端 React 和后端 Express 打包在同一个容器中，通过 Node.js 处理或前端静态文件。

- **优势**：
  - **环境一致性**：一次构建，到处运行。
  - **支持 SQLite**：无需额外购买数据库，直接将 `.db` 文件挂载到宿主机即可实现持久化。
  - **私有化**：代码和数据完全掌握在自己手中。
- **缺点**：需要一台具有公网 IP 的服务器（VPS）或配置好内网穿透。
- **文档**：[DOCKER_DEPLOY.md](file:///d:/git/VanceFeedback/DOCKER_DEPLOY.md)

### 2. Vercel 全栈部署 (推荐 - 个人/快速演示)
利用 Vercel 的 Serverless Functions 托管 API，同时将 React 静态文件部署到全球 CDN。

- **优势**：
  - **完全自动化**：推送代码到 GitHub 自动部署。
  - **极速访问**：前端静态资源全球 CDN 分发。
  - **免费额度高**：适合中小型项目。
- **注意**：Vercel 环境不支持持久化存储，**必须使用外部 MySQL 数据库**（如 TiDB Cloud, Railway MySQL 等）。
- **文档**：[DEPLOY_VERCEL_FULLSTACK.md](file:///d:/git/VanceFeedback/DEPLOY_VERCEL_FULLSTACK.md)

### 3. Cloudflare Pages + Workers (边缘部署)
通过 `_worker.js` 或 Pages Functions 运行后端逻辑。

- **优势**：
  - **边缘运行**：后端逻辑在离用户最近的边缘节点运行，延迟极低。
  - **无冷启动**：相比 Vercel 性能更稳健。
- **注意**：对 Node.js 标准库有一定兼容性限制，建议配合其 D1 数据库或外部 MySQL。
- **适用场景**：对全球访问速度有极端要求的项目。

### 4. Railway / Zeabur / Render (PaaS 平台)
这些平台支持直接导入 GitHub 仓库并自动识别 Dockerfile 或 package.json。

- **优势**：
  - **一键托管**：自动配置环境和 SSL。
  - **自带数据库**：可以一键创建 MySQL 实例。
- **成本**：通常提供 5$ 或一定时间的免费额度，超出后按需计费。

---

## 💡 决策建议

1. **如果你有自己的 VPS/服务器**：
   👉 **选择 Docker**。这是性价比最高、最稳健的方式，且配置私有化最简单。
   
2. **如果你不想花钱，且只要性能好**：
   👉 **选择 Vercel + 外部免费 MySQL (如 TiDB Serverless)**。这能让你获得顶级的 CDN 加速体验。

3. **如果你是内网部署 (如 NAS/树莓派)**：
   👉 **选择 Docker + SQLite**。直接挂载一个目录即可完成备份。

4. **如果是大规模商业用途**：
   👉 **选择前后端分离部署 (DEPLOY_SEPARATED.md)**，将前端放 CDN，后端部署在 k8s 或高配云服务器，数据库使用 RDS。

---

> [!TIP]
> 无论选择哪种方案，请务必在部署前按照 `.env.example` 配置好环境变量，特别是 `GEMINI_API_KEY`，否则 AI 功能将无法使用。
