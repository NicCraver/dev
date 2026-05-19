# Monorepo 架构升级 — Monorepo Architecture Design

> 日期：2026-05-19

## 目标

将 mt-dev 升级为 pnpm monorepo，前端 React + Tailwind + shadcn + motion，后端 Hono (Node.js)，完成 `/api/health` 前后端联调。

## 目录结构

```
mt-dev/
├── apps/
│   ├── web/          # React 前端 (:6111)
│   └── api/          # Hono 后端 (:6333)
├── packages/
│   └── shared/       # 共享类型
└── pnpm-workspace.yaml
```

## 路由

| 环境 | 前端                     | 后端                          |
| ---- | ------------------------ | ----------------------------- |
| 本地 | `http://localhost:6111`  | `http://localhost:6333`       |
| 生产 | `https://env.nextdev.cc` | `https://env.nextdev.cc/api/` |

## 联调范围（A 阶段）

- `GET /api/health` → `{ "status": "ok" }`
- 前端展示连接状态，含 motion 动画
- MongoDB 留待 B 阶段

## 部署

内网 Nginx：`/` → 前端静态资源，`/api/` → 反代 Hono `:6333`
