# PM2 Web UI — 设计说明

> **文档版本**：1.0  
> **更新日期**：2026-05-25  
> **状态**：待评审  
> **路由**：`/pm2`  
> **所属产品**：mt-dev Dev Dash（`env.nextdev.cc`）

---

## 1. 背景与问题

内部开发/运维需要在浏览器里查看本机 PM2 进程状态、重启服务、查看日志，并能通过 UI 新增进程，而不必反复 SSH 或切终端。Dev Dash 已有模块注册表与 Hono API，适合作为 PM2 的轻量 Web 控制台。

**约束**：PM2 daemon 仅存在于运行 API 的那台机器上；Cloudflare Pages 上的静态前端无法直接连 PM2，必须经 `apps/api` 代理。

---

## 2. 已确认决策

| 项       | 选择                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------- |
| 部署范围 | **单机** — API 与 PM2 同机，通过 `pm2` npm 包连本地 daemon                                         |
| v1 能力  | **全功能** — 列表监控 + restart/stop/start + 历史/实时日志 + 详情（env/cwd/args）+ **UI 新增进程** |
| 新增方式 | **D** — Tab「快速启动」+ Tab「Ecosystem 导入」                                                     |
| 持久化   | **C** — 默认手动 `pm2 save`；设置里可开「自动保存」                                                |
| 鉴权     | **D** — 本地未设 Token 时免鉴权；生产设 `PM2_API_TOKEN`，所有 `/api/pm2/*` 需 Bearer               |
| 实现方案 | **`pm2` npm 包** + Hono REST/SSE，不用 CLI 子进程                                                  |

---

## 3. 目标

| 目标     | 说明                                                           |
| -------- | -------------------------------------------------------------- |
| 进程一览 | 名称、状态、CPU、内存、uptime、pid                             |
| 进程控制 | restart / stop / start，危险操作需确认                         |
| 日志     | 历史 tail + SSE 实时流                                         |
| 详情     | describe：cwd、args、env、exec_mode、instances 等              |
| 新增进程 | 简易表单或导入 ecosystem，勾选 app 启动                        |
| 持久化   | 手动「保存 PM2 列表」；可选自动 save                           |
| 安全     | 生产 Token；写操作与读操作均受 Token 保护（当 Token 已配置时） |
| 优雅降级 | PM2 未启用或 daemon 不可达时，前端友好空状态                   |

---

## 4. 非目标（v1）

- 远程多机 / SSH agent
- 通过 UI **编辑**已有 ecosystem 文件并写回磁盘
- 完整用户登录体系（沿用 Bearer Token + localStorage）
- 进程删除（`pm2 delete`）— 可留 v1.1；v1 仅 stop
- PM2 集群跨主机、Keymetrics 集成
- 在 Cloudflare Pages 边缘运行 PM2（不可能）

---

## 5. 架构

```
浏览器 (Dev Dash /pm2)
    │  fetch + SSE
    ▼
apps/api  /api/pm2/*
    │  pm2.connect() → ~/.pm2/rpc.sock
    ▼
本机 PM2 daemon → 各 Node 进程
```

### 5.1 模块注册

| 步骤 | 位置                                                            |
| ---- | --------------------------------------------------------------- |
| 1    | `packages/shared/src/index.ts` — `DevDashModuleId` 增加 `"pm2"` |
| 2    | `packages/shared/src/pm2.ts` — 共享 DTO / 请求体类型            |
| 3    | `apps/web/src/app/modules.ts` — 注册侧栏模块                    |
| 4    | `apps/web/src/pages/pm2/` — 页面与组件                          |
| 5    | `apps/web/src/lib/pm2-api.ts` — 前端 API 封装                   |
| 6    | `apps/api/src/pm2/client.ts` — PM2 连接单例 + promisify         |
| 7    | `apps/api/src/routes/pm2.ts` — 路由注册                         |
| 8    | `apps/api/src/index.ts` — `registerPm2Routes(app)`              |

路由仍由 `modules` 数组驱动，`App.tsx` 无需改动。

### 5.2 启用条件

- 环境变量 `PM2_ENABLED=true` 时注册 PM2 路由；否则 `/api/pm2/status` 返回 `{ enabled: false }`，前端显示「PM2 未启用」。
- 运行时若 `pm2.connect()` 失败（daemon 未启动），相关接口返回 `503` + 明确 `message`。

---

## 6. 后端 API

### 6.1 鉴权中间件

- `PM2_API_TOKEN` **未设置**：跳过鉴权（本地开发）。
- **已设置**：所有 `/api/pm2/*` 请求需 `Authorization: Bearer <token>`，否则 `401`。
- `GET /api/pm2/status` 可返回 `{ enabled, authRequired }` 供前端决定是否弹 Token 设置。

### 6.2 接口列表

| 方法 | 路径                                    | 说明                                   |
| ---- | --------------------------------------- | -------------------------------------- |
| GET  | `/api/pm2/status`                       | enabled、authRequired、daemonReachable |
| GET  | `/api/pm2/processes`                    | 进程列表                               |
| GET  | `/api/pm2/processes/:id`                | 单进程详情（pm2 describe）             |
| POST | `/api/pm2/processes/start`              | 快速启动（结构化 body，见 6.3）        |
| POST | `/api/pm2/processes/start-ecosystem`    | 解析 ecosystem 并启动选中 app          |
| POST | `/api/pm2/processes/:id/restart`        | 重启                                   |
| POST | `/api/pm2/processes/:id/stop`           | 停止                                   |
| POST | `/api/pm2/processes/:id/start`          | 启动已 stop 的进程                     |
| GET  | `/api/pm2/processes/:id/logs?lines=200` | 历史日志（stdout+stderr）              |
| GET  | `/api/pm2/processes/:id/logs/stream`    | SSE 实时日志                           |
| POST | `/api/pm2/save`                         | 执行 `pm2 save`                        |

`:id` 为 PM2 的 `pm_id`（数字）。

### 6.3 快速启动请求体

```ts
type Pm2QuickStartRequest = {
  script: string; // 必填
  name: string; // 必填
  cwd?: string;
  args?: string[]; // 不含 node，PM2 script args
  env?: Record<string, string>;
  instances?: number; // 默认 1
};
```

后端用 `pm2.start(options, cb)`，**禁止**拼接 shell 命令。

### 6.4 Ecosystem 启动

```ts
type Pm2EcosystemStartRequest = {
  content: string; // 文件全文
  appNames?: string[]; // 不传则启动全部 apps
};
```

- 支持 `module.exports = { apps: [...] }` 的 `.js` / `.cjs` / `.json` 文本。
- 使用 **受控解析**（如 `vm.runInNewContext` + 白名单导出结构校验），不支持含函数的 dynamic config；解析失败返回可读错误。
- 解析成功后列出 apps（name、script），前端多选，提交时只启动选中项（多次 `pm2.start` 或临时写 temp ecosystem 再 start — 实现时选更简单且安全者）。

### 6.5 日志 SSE

- 使用 `pm2.launchBus()` 订阅 `log:out` / `log:err`，按 `pm_id` 过滤。
- Hono 返回 `text/event-stream`；客户端断开时关闭 bus 订阅，避免泄漏。
- 历史日志用 `pm2.describe` + flush logs 或 `pm2 logs --nostream` 的 programmatic 等价（优先官方 API）。

### 6.6 自动 save

- 后端不持久化「自动 save」开关；由前端 `localStorage`（key: `pm2-auto-save`）控制。
- 当开关为 true 时，前端在 **start / restart / stop / start-ecosystem** 成功后额外调用 `POST /api/pm2/save`。
- 页面提供独立按钮「保存 PM2 列表」随时手动 save。

---

## 7. 共享类型（`packages/shared/src/pm2.ts`）

导出示例：

- `Pm2ProcessSummary` — id, name, status, cpu, memory, uptime, pid
- `Pm2ProcessDetail` — 扩展 env, cwd, args, execMode, instances, …
- `Pm2StatusResponse`
- `Pm2QuickStartRequest` / `Pm2EcosystemStartRequest`
- `Pm2LogsResponse`

---

## 8. 前端 UI

### 8.1 布局

```
┌─────────────────────────────────────────────────────────┐
│ PM2 进程管理    [新增进程] [保存列表] [刷新] [⚙ 设置]      │
├──────────────────┬──────────────────────────────────────┤
│ 进程列表（5s 刷新）│ 详情 + 操作 + 日志                      │
│ • mt-dev-api     │ 状态 / CPU / 内存 / uptime            │
│ • …              │ env · cwd · args（折叠 JSON）          │
│                  │ [Restart] [Stop] [Start]              │
│                  │ ── 日志（历史 + SSE tail）──            │
└──────────────────┴──────────────────────────────────────┘
```

### 8.2 新增进程 Dialog

**Tab 1 — 快速启动**：脚本路径、进程名、cwd、args、env KV、instances。

**Tab 2 — Ecosystem**：粘贴/上传 → 解析预览 app 列表 → 多选 → 启动。

提交成功：关闭 Dialog、刷新列表、若开启自动 save 则调用 save API。

### 8.3 设置（⚙）

- **API Token**：输入后存 `localStorage`（`pm2-api-token`），请求自动带 Bearer。
- **自动保存**：checkbox，存 `pm2-auto-save`，默认 **关**。
- **自动刷新间隔**：默认 5s，可关。

### 8.4 空状态

| 条件                | 展示                                     |
| ------------------- | ---------------------------------------- |
| `PM2_ENABLED=false` | 「当前环境未启用 PM2 模块」              |
| daemon 不可达       | 「PM2 daemon 未运行，请先执行 pm2 ping」 |
| 401                 | 提示配置 Token                           |
| 无进程              | 「暂无进程，点击新增进程」               |

### 8.5 目录结构

```
apps/web/src/
├── pages/pm2/
│   └── Pm2Page.tsx
├── components/pm2/
│   ├── ProcessList.tsx
│   ├── ProcessDetail.tsx
│   ├── LogViewer.tsx
│   ├── StartProcessDialog.tsx
│   └── Pm2SettingsDialog.tsx
├── hooks/
│   └── usePm2Data.ts
└── lib/
    └── pm2-api.ts
```

---

## 9. 环境变量

`apps/api/.env.example` 新增：

```bash
# PM2 Web UI（仅 API 与 PM2 同机时有效）
PM2_ENABLED=false
PM2_API_TOKEN=
```

| 变量            | 说明                                       |
| --------------- | ------------------------------------------ |
| `PM2_ENABLED`   | `true` 时注册 `/api/pm2/*`                 |
| `PM2_API_TOKEN` | 生产建议设置；设置后所有 PM2 API 需 Bearer |

---

## 10. 依赖

- `apps/api` 新增 `pm2`（及 `@types/pm2` 若有）。
- 仅 API 包依赖；Web 不直接引 pm2。

---

## 11. 错误处理

| 场景                       | HTTP    | 前端            |
| -------------------------- | ------- | --------------- |
| PM2 未启用                 | 503     | 模块级空状态    |
| daemon 断开                | 503     | 提示启动 pm2    |
| 未授权                     | 401     | 打开 Token 设置 |
| 进程不存在                 | 404     | Toast           |
| ecosystem 解析失败         | 400     | Dialog 内联错误 |
| start 失败（路径不存在等） | 400/500 | Toast + message |

---

## 12. 安全注意

- 生产必须设置 `PM2_API_TOKEN`；Token 仅内网分发。
- Ecosystem 解析禁止任意代码执行：仅提取 `apps` 数组，拒绝 `require` 外链（或仅允许 JSON）。
- 不对用户输入做 shell 拼接；一律结构化传给 `pm2.start`。
- 重启 API 进程本身时需 UI 二次确认（若 name 匹配当前 API 进程）。

---

## 13. 测试与验证

- 本地：`PM2_ENABLED=true`，`pm2 start` 一个 dummy 脚本，验证列表/日志/重启/新增/ save。
- 无 PM2：`PM2_ENABLED=false`，前端空状态。
- Token：设 `PM2_API_TOKEN`，无 Header 时 401，有 Header 时通过。
- `pnpm check` 全仓类型检查通过。

---

## 14. 演进（v1.1+）

- `pm2 delete` 与 bulk 操作
- 从 UI 导出当前 dump 为 ecosystem 模板
- 进程级 env 在线编辑（`pm2 restart --update-env`）
- 可选：仅内网 IP 允许访问 PM2 路由（middleware）

---

## 15. 决策记录

| 日期       | 决策                                               |
| ---------- | -------------------------------------------------- |
| 2026-05-25 | 单机 + 全功能 v1 + UI 新增（快速启动 + ecosystem） |
| 2026-05-25 | 鉴权：本地免 Token / 生产 Bearer                   |
| 2026-05-25 | pm2 save：默认手动，设置可开自动 save              |
