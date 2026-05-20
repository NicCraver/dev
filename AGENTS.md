# mt-dev (Dev Dash)

内部开发工具台：左侧应用栏切换模块，右侧为各模块页面。当前已实现 **O5 env**（账号环境）与 **工具**（JSON 修复、时间戳转换等）；智邮 / aichat env 为 Coming Soon 占位。

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

本地联调：Web `http://localhost:6111`，API `http://localhost:6333`；Vite 将 `/api` 代理到 API。生产域名为 `https://env.nextdev.cc`。

## 常用命令

根目录使用 **pnpm** 编排 workspace；各 app 的 format/lint/typecheck/build 走 **Vite+**（`vp`）。

```bash
pnpm install              # 拉代码后先装依赖
pnpm dev                  # 并行启动 web + api
pnpm dev:web              # 仅前端
pnpm dev:api              # 仅后端
pnpm build                # 全量构建
pnpm check                # 各包 check（web 为 vp check）
```

在 `apps/web` 内也可直接 `vp dev` / `vp check` / `vp build`。

## 前端架构约定

- **模块注册**：`apps/web/src/app/modules.ts` 定义 `DevDashModule`（id、路由、图标、页面组件）。新增侧栏模块时同步更新 `packages/shared` 中的 `DevDashModuleId` 与 `App.tsx` 路由（由 `modules` 数组驱动）。
- **壳布局**：`AppShell` = `AppRail` + `<Outlet />`；默认重定向到 `/o5-env`。
- **工具页**：`apps/web/src/app/tools/registry.tsx` 注册 `ToolDefinition`；页面在 `components/tools/`，纯逻辑可放 `lib/`（如 `json-repair.ts`、`timestamp-parse.ts`）。
- **O5 env**：`pages/o5-env/`、`components/o5-env/`；账号数据目前来自 `mocks/o5-env.ts`。
- **UI**：shadcn 风格组件在 `components/ui/`；图标用 `@hugeicons/react`；样式 Tailwind 4 + `index.css` 设计 token。
- **交互**：键盘/滚动等共享逻辑见 `lib/interaction.ts`、`lib/keyboard-shortcut.ts`。

## 后端约定

- 入口 `apps/api/src/index.ts`（Hono + `@hono/node-server`）。
- 新增接口保持 `/api/*` 前缀；共享响应类型放在 `@mt-dev/shared`。
- 环境变量示例见 `apps/api/.env.example`（默认 `PORT=6333`）。

## 改动时注意

- 共享类型改 `packages/shared` 后，web/api 需能类型检查通过。
- 新模块/工具优先沿用现有注册表模式，避免硬编码散落多处。
- 未要求时不要提交；验证改动至少跑 `pnpm check`（或 `apps/web` 下 `vp check`）。

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.

<!--VITE PLUS END-->
