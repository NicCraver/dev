# mt-dev (Dev Dash)

内部开发工具台：统一入口承载 O5 账号环境、实用工具、PM2 进程管理等模块。

| 环境             | 地址                  |
| ---------------- | --------------------- |
| 本地开发         | http://localhost:6111 |
| 生产（内网/VPN） | http://env.nextdev.cc |

## 功能模块

- **O5 env** — 账号与环境管理、外链跳转
- **工具** — JSON 修复、时间戳转换等
- **PM2** — 进程列表、日志、启停（需 API 侧 `PM2_ENABLED=true`）
- 智邮 / aichat env — Coming Soon

设计文档：`docs/superpowers/specs/`、`docs/superpowers/plans/`。

## 本地开发

### 前置

- Node 22+（推荐 nvm）
- pnpm 11
- [Vite+](https://viteplus.dev/)（`vp`）

### 启动

```bash
pnpm install
pnpm dev          # 并行 web (:6111) + api (:6333)
# 或
pnpm dev:web
pnpm dev:api
```

Web 通过 Vite 将 `/api` 代理到 `http://localhost:6333`。

### MongoDB（O5 env）

```bash
cp apps/api/.env.example apps/api/.env   # 按需改 MONGODB_URI
pnpm --filter @mt-dev/api db:init
pnpm --filter @mt-dev/api db:seed        # 可选
```

无 Mongo 时 O5 env 回退到 mock 数据。

### 校验

```bash
pnpm check
```

## 生产部署

推荐 **Nginx（Web）+ PM2（API）**（`pnpm deploy`），约 1–2 分钟。

### 谁负责什么

| 职责           | 运行方式                 | 说明                                   |
| -------------- | ------------------------ | -------------------------------------- |
| **前端静态页** | Nginx `:80`              | 读 `apps/web/dist`，**不需要** PM2 web |
| **API**        | PM2 `mt-dev-api` `:6333` | Hono；Nginx 把 `/api/` 反代过来        |
| **PM2 管理页** | 同上 API                 | `PM2_ENABLED=true` 时可用              |

`pnpm deploy` 会构建前端、rsync 到服务器、**PM2 只重启 API**。Nginx 无需重启（静态文件已更新）；若改了 Nginx 模板需手动 `sudo nginx -s reload`。

### 1. 配置部署变量

```bash
cp .env.deploy.ssh.example .env.deploy.ssh
```

编辑 `.env.deploy.ssh`（勿提交 git）：

```bash
DEPLOY_HOST=env.lif3ng.cn      # SSH 跳板/主机名
DEPLOY_USER=lifeng
DEPLOY_PATH=/home/lifeng/mt-dev
DEPLOY_PUBLIC_URL=http://env.nextdev.cc
DEPLOY_HEALTH_URL=http://env.nextdev.cc/api/health
PM2_PAGE_PASSWORD=             # 可选，PM2 页面访问密码
```

### 2. 一键部署

```bash
pnpm deploy          # 同 deploy:fast
pnpm deploy:fast     # 本地构建 + rsync + 远程 PM2 重启 API
pnpm deploy:docker   # Docker Compose 方式（备选）
```

`deploy:fast` 流程：本地构建 Web → rsync 到服务器 → 远程 `pnpm install` → `pm2 startOrRestart`（**仅 `mt-dev-api`**）。

### 3. 自动部署（push 后）

首次在本机启用 Git hook：

```bash
pnpm hooks:install    # 设置 core.hooksPath=.githooks
cp .env.deploy.ssh.example .env.deploy.ssh   # 若尚未配置
```

之后 **`git push origin main`** 成功后会自动执行 `pnpm deploy`。

```bash
# 跳过单次自动部署
MT_DEV_SKIP_DEPLOY=1 git push

# 关闭 hooks
git config --unset core.hooksPath
```

要求：本机已配 `.env.deploy.ssh`，且能 SSH 到 `DEPLOY_HOST`（通常需连内网/VPN）。

### 4. 服务器首次配置

#### DNS（Cloudflare）

| 类型 | 名称             | 内容                               | 代理           |
| ---- | ---------------- | ---------------------------------- | -------------- |
| A    | `env.nextdev.cc` | 服务器内网 IP（如 `192.168.5.46`） | 仅 DNS（灰云） |

内网 IP 无法走 Cloudflare 橙云代理；HTTPS 如需可自行在 Nginx 配证书。

#### Nginx

模板：`scripts/nginx/mt-dev.conf.example`

```bash
# 本地上传
scp scripts/nginx/mt-dev.conf.example lifeng@env.lif3ng.cn:/tmp/mt-dev.conf

# 服务器上（需 sudo）
ssh lifeng@env.lif3ng.cn
pm2 stop mt-dev-web 2>/dev/null || true   # 若曾手动启过 web 进程
sudo cp /tmp/mt-dev.conf /etc/nginx/conf.d/mt-dev.conf
sudo nginx -t && sudo nginx -s reload
```

配置说明：

- `:80` + `server_name env.nextdev.cc` — 静态 `apps/web/dist` + `/api/` 反代 `:6333`
- `:51611` — 可选，301 跳转到 `http://env.nextdev.cc`（需先释放端口，勿与 PM2 web 同占）

与 `/etc/nginx/nginx.conf` 内联的其他站点**按 `server_name` 分流，互不冲突**。

#### PM2（仅 API）

生产**只需** PM2 跑 API，Web 由 Nginx 托管：

```bash
pm2 startOrRestart ecosystem.config.cjs --update-env   # 仅 mt-dev-api
pm2 save
pm2 list    # mt-dev-api online；不应再有 mt-dev-web
```

API 环境变量：`apps/api/.env`（从 `.env.example` 复制），部署脚本会自动设 `PM2_ENABLED=true`。

### 5. 验证

```bash
curl http://env.nextdev.cc/api/health    # {"status":"ok"}
curl -I http://env.nextdev.cc/
curl -I http://192.168.5.46:51611/       # 若启用跳转 → 301
```

## 生产架构

```
浏览器 → env.nextdev.cc (DNS → 内网 IP)
              ↓
         Nginx :80
         ├── /        → apps/web/dist (SPA)
         └── /api/    → 127.0.0.1:6333 (PM2 mt-dev-api)
```

| 组件             | 端口  | 说明                      |
| ---------------- | ----- | ------------------------- |
| Nginx            | 80    | Web 静态 + API 反代       |
| Nginx            | 51611 | 可选，旧 IP 入口 301 跳转 |
| PM2 `mt-dev-api` | 6333  | **唯一需要 PM2 的进程**   |
| MongoDB          | 27017 | O5 env 数据（同机或内网） |

> **PM2 还要用，但只跑 API。** 前端由 Nginx 直接读 `dist`，不要启 `mt-dev-web`。

无 Nginx 时的备选：`scripts/serve-web.mjs` 可单独起静态站（默认 `:51611`），见 `scripts/nginx/mt-dev-ip.conf.example`。

## 目录结构

```
mt-dev/
├── apps/web/           # React 前端
├── apps/api/           # Hono API
├── packages/shared/    # 共享类型
├── scripts/
│   ├── deploy-fast.sh
│   ├── deploy-docker.sh
│   ├── install-githooks.sh
│   └── nginx/          # Nginx 配置模板
├── .githooks/          # post-push 自动部署（pnpm hooks:install 启用）
├── ecosystem.config.cjs
└── docker-compose.yml
```

## 相关文档

- [AGENTS.md](./AGENTS.md) — AI/贡献者用的架构与约定摘要
- `docs/superpowers/specs/` — 产品设计
- `docs/superpowers/plans/` — 实现计划
