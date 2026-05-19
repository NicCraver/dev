# Dev Dash 聚合台 — 设计说明

> 日期：2026-05-19  
> 状态：已确认

## 背景

`mt-dev`（`env.nextdev.cc`）需要一套面向内部开发的**聚合 Dash**：统一入口承载多个子工具。首版只做应用壳与占位，数据与业务功能后续迭代接入。

## 目标

- 提供 **左侧应用栏（App Rail）** 切换子模块
- v1 包含三个入口：**环境账号**、**AI Chat Dev**、**Tools**
- 各模块 v1 均为 **Coming Soon** 占位页
- 架构支持后续将占位替换为真实页面，无需改动壳层

## 非目标（v1）

- 登录 / 权限
- 真实 API、`apps/api` 联调
- 环境账号「系统 → 环境 → 账号列表」业务 UI
- ai-chat、tools 的真实功能

## 已确认决策

| 项       | 选择                               |
| -------- | ---------------------------------- |
| 数据策略 | 先 UI 壳 + 占位，接口后接          |
| 导航     | 最左应用栏；模块内布局由各模块自定 |
| v1 范围  | 仅壳 + 三模块占位                  |

## 信息架构

```
┌────┬──────────────────────────────────────┐
│图标│  模块内容区（Outlet）                    │
│栏  │  → ComingSoon 或未来真实页面            │
└────┴──────────────────────────────────────┘
```

| 模块        | 路由       | v1         |
| ----------- | ---------- | ---------- |
| 环境账号    | `/env`     | ComingSoon |
| AI Chat Dev | `/ai-chat` | ComingSoon |
| Tools       | `/tools`   | ComingSoon |

- `/` 重定向至 `/env`
- 原 `HealthCheck` 演示保留在 `/debug/health`，不占应用栏

## 技术方案

### 模块注册表（推荐架构）

`apps/web/src/app/modules.ts` 声明模块元数据（id、label、path、icon、page 组件）。`AppShell` 与 `react-router` 路由均由注册表生成，避免硬编码三处。

```ts
export const modules = [
  { id: "env", label: "环境账号", path: "/env", icon: Users, page: ComingSoon },
  { id: "ai-chat", label: "AI Chat Dev", path: "/ai-chat", icon: MessageSquare, page: ComingSoon },
  { id: "tools", label: "Tools", path: "/tools", icon: Wrench, page: ComingSoon },
] as const;
```

### 技术栈

- React 19 + `react-router-dom`
- Tailwind + shadcn/ui + lucide-react
- motion（模块切换 fade，可选）
- `packages/shared`：导出 `DevDashModuleId` 类型供前后端共用

### 目录结构

```
apps/web/src/
├── app/
│   ├── AppShell.tsx
│   └── modules.ts
├── components/
│   └── app-rail/
│       ├── AppRail.tsx
│       └── AppRailItem.tsx
├── pages/
│   ├── ComingSoon.tsx
│   └── HealthCheckPage.tsx   # 包装现有 HealthCheck
└── App.tsx                   # BrowserRouter + routes
```

## 占位页 UX

- 显示模块中文名
- 副文案：「开发中，敬请期待」
- 通过路由 / 注册表传入 `moduleLabel`

## 演进路线

1. **v1.1** — `/o5-env`：Mock 数据 + 双栏（系统 / 环境 / 账号）→ 详见 [O5 Env PRD](./2026-05-19-o5-env-prd.md)
2. **v1.2** — `apps/api` 提供 `/api/o5/*`，前端替换 Mock
3. **并行** — `zhiyou-env`、`aichat-env` 等按注册表逐项替换 `ComingSoon`

## 部署

与 monorepo 设计一致：生产 `https://env.nextdev.cc`，SPA 需 Nginx `try_files` 回退 `index.html`（已有内网部署约定）。
