# mt-dev (Dev Dash)

内部开发工具台：左侧应用栏切换模块，右侧为各模块页面。当前已实现 **O5 env**（账号环境）、**工具**（JSON 修复、时间戳转换等）、**PM2**（进程管理）；智邮 / aichat env 为 Coming Soon 占位。

设计文档见 `docs/superpowers/specs/` 与 `docs/superpowers/plans/`。

## Monorepo 结构

```
mt-dev/
├── apps/
│   ├── web/          # @mt-dev/web — React 19 + Vite+ + Tailwind 4 (:6111)
│   └── api/          # @mt-dev/api — Hono on Node (:6333)
├── packages/
│   └── shared/       # @mt-dev/shared — 前后端共享类型
└── pnpm-workspace.yaml
```

| 包                | 说明                                   |
| ----------------- | -------------------------------------- |
| `apps/web`        | 前端；路径别名 `@` → `apps/web/src`    |
| `apps/api`        | REST API；路由前缀 `/api`              |
| `packages/shared` | 如 `HealthResponse`、`DevDashModuleId` |

本地联调：Web `http://localhost:6111`，API `http://localhost:6333`；Vite 将 `/api` 代理到 API。生产域名为 `http://env.nextdev.cc`（内网/VPN + Cloudflare DNS only）。

## 常用命令

根目录使用 **pnpm** 编排 workspace；各 app 的 format/lint/typecheck/build 走 **Vite+**（`vp`）。

```bash
pnpm install              # 拉代码后先装依赖
pnpm dev                  # 并行启动 web + api
pnpm dev:web              # 仅前端
pnpm dev:api              # 仅后端
pnpm build                # 全量构建
pnpm check                # 各包 check（web 为 vp check）
pnpm deploy               # 生产部署（PM2 API + rsync，见下）
pnpm deploy:docker        # Docker Compose 部署（备选）
pnpm hooks:install        # 启用 push 后自动部署
```

在 `apps/web` 内也可直接 `vp dev` / `vp check` / `vp build`。

## 生产部署

人类可读说明见根目录 [README.md](./README.md)。

### 部署方式

| 命令                 | 脚本                       | 说明                                             |
| -------------------- | -------------------------- | ------------------------------------------------ |
| `pnpm deploy`        | `scripts/deploy-fast.sh`   | **推荐**。本地 build → rsync → 远程 PM2 重启 API |
| `pnpm deploy:docker` | `scripts/deploy-docker.sh` | Docker 镜像构建/上传，Nginx 仍托管 Web           |

部署变量：复制 `.env.deploy.ssh.example` → `.env.deploy.ssh`（gitignore）。关键项：`DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_PATH`、`DEPLOY_PUBLIC_URL`、`DEPLOY_HEALTH_URL`、`PM2_PAGE_PASSWORD`。

### 生产架构（当前）

```
env.nextdev.cc → Nginx :80 → apps/web/dist + /api/ → PM2 mt-dev-api :6333
```

| 组件                    | 启动方式                                                |
| ----------------------- | ------------------------------------------------------- |
| Web 静态 + `/api/` 反代 | Nginx（`scripts/nginx/mt-dev.conf.example`）            |
| API + PM2 管理接口      | PM2 **`mt-dev-api` 唯一进程**（`ecosystem.config.cjs`） |

- **Web**：Nginx 读 `apps/web/dist`；**不要** PM2 `mt-dev-web`（已从 ecosystem 移除）。
- **API**：PM2 跑 `apps/api:6333`；`PM2_ENABLED=true` 时开放 `/api/pm2/*`。
- **部署**：`pnpm deploy` = build + rsync + `pm2 startOrRestart`（只重启 API）；Nginx 一般无需 reload。
- **DNS**：Cloudflare `env.nextdev.cc` A → 内网 IP，**仅 DNS**（私网 IP 不能橙云）。
- **旧入口**：`mt-dev.conf.example` 可选 `:51611` → 301 域名；启用前确保无 `mt-dev-web` 占端口。

### 自动部署

```bash
pnpm hooks:install   # 一次性：git config core.hooksPath .githooks
```

`git push origin main` 后执行 `scripts/deploy-fast.sh`。需本机 `.env.deploy.ssh`；跳过：`MT_DEV_SKIP_DEPLOY=1 git push`。

Nginx 模板在 `scripts/nginx/`：

| 文件                     | 用途                             |
| ------------------------ | -------------------------------- |
| `mt-dev.conf.example`    | 域名 `:80` + 可选 `:51611` 跳转  |
| `mt-dev-ip.conf.example` | 无域名时 Nginx 直接监听 `:51611` |
| `docker.conf`            | Docker web 容器内 Nginx          |

安装（服务器需 sudo）：

```bash
sudo cp scripts/nginx/mt-dev.conf.example /etc/nginx/conf.d/mt-dev.conf
sudo nginx -t && sudo nginx -s reload
```

与 `/etc/nginx/nginx.conf` 内联的其他 `server` 按 `server_name` 分流，一般无需改主配置。

### 服务器信息（参考）

| 项       | 值                      |
| -------- | ----------------------- |
| SSH      | `lifeng@env.lif3ng.cn`  |
| 代码路径 | `/home/lifeng/mt-dev`   |
| 内网 IP  | `192.168.5.46`          |
| API 端口 | `6333`                  |
| 域名     | `http://env.nextdev.cc` |

无 Nginx 备选：`scripts/serve-web.mjs`（`:51611` 静态 + API 反代），`pm2 start scripts/serve-web.mjs --name mt-dev-web`。

## 前端架构约定

- **模块注册**：`apps/web/src/app/modules.ts` 定义 `DevDashModule`（id、路由、图标、页面组件）。新增侧栏模块时同步更新 `packages/shared` 中的 `DevDashModuleId` 与 `App.tsx` 路由（由 `modules` 数组驱动）。
- **壳布局**：`AppShell` = `AppRail` + `<Outlet />`；默认重定向到 `/o5-env`。
- **工具页**：`apps/web/src/app/tools/registry.tsx` 注册 `ToolDefinition`；页面在 `components/tools/`，纯逻辑可放 `lib/`（如 `json-repair.ts`、`timestamp-parse.ts`）。
- **O5 env**：`pages/o5-env/`、`components/o5-env/`；数据来自 `GET /api/o5-env/bootstrap`（Mongo 库 `mt-dev`：`accounts` 全局账号 + `systems` 环境与引用），dev 无库时回退 `mocks/o5-env.ts`；`pnpm --filter @mt-dev/api db:init` / `db:seed`；跳转见 `lib/external-login.ts`、`lib/account-jump.ts`。
- **UI**：shadcn 风格组件在 `components/ui/`；图标用 `@hugeicons/react`；样式 Tailwind 4 + `index.css` 设计 token。
- **交互**：键盘/滚动等共享逻辑见 `lib/interaction.ts`、`lib/keyboard-shortcut.ts`。
- **质量检查**：改完前端后，在 `apps/web` 目录执行 `npx -y react-doctor@latest .`，按报告修复问题直至得分为 **100**。

## 后端约定

- 入口 `apps/api/src/index.ts`（Hono + `@hono/node-server`）。
- 新增接口保持 `/api/*` 前缀；共享响应类型放在 `@mt-dev/shared`。
- 环境变量见 `apps/api/.env.example`（启动时自动加载；可选 `apps/api/.env` 覆盖，已 gitignore）。
- O5 相关路由：`/api/o5-env/bootstrap`、`/api/o5-env/login-proxy`、`/api/user/add`、`/api/link/add`、`/api/recommend/:env`、`/api/share/new`。Mongo 集合见 `apps/api/src/db/mongo.ts`（`accounts`、`systems`；旧 `kvs` 仅 env-share 兼容）。
- PM2 路由（`PM2_ENABLED=true`）：`/api/pm2/*`，实现见 `apps/api/src/routes/pm2.ts`、`apps/api/src/pm2/`。

## 改动时注意

- 共享类型改 `packages/shared` 后，web/api 需能类型检查通过。
- 新模块/工具优先沿用现有注册表模式，避免硬编码散落多处。
- 未要求时不要提交；验证改动至少跑 `pnpm check`（或 `apps/web` 下 `vp check`）。
- 涉及 `apps/web` 的改动，还需在 `apps/web` 下跑 `npx -y react-doctor@latest .`，修复全部问题直至得分为 100。

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
