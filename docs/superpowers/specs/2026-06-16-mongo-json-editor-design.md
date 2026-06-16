# Mongo JSON 编辑器 — 设计说明

> **文档版本**：1.0  
> **更新日期**：2026-06-16  
> **状态**：已确认  
> **路由**：`/mongo`  
> **所属产品**：mt-dev Dev Dash（`env.nextdev.cc`）

---

## 1. 背景与问题

mt-dev 使用 MongoDB（`MONGODB_URI`）存储 O5 env 的 `accounts`、`systems` 等数据。当前仅能通过 O5 env 页面的业务表单间接改库，或 SSH + mongosh 直接操作。开发/运维有时需要**直接查看并编辑文档 JSON**（修脏数据、批量结构调整、排查字段），缺少内嵌工具。

---

## 2. 已确认决策

| 项         | 选择                                                                           |
| ---------- | ------------------------------------------------------------------------------ |
| 交互形态   | **直接改 JSON** — 三栏：集合 → 文档列表 → JSON 编辑器                          |
| 数据库范围 | **仅 `MONGODB_URI` 指向的库**（当前为 `mt-dev`），不跨库、不连其他实例         |
| 写操作     | **支持** — 保存（整文档替换）、新建文档、删除文档（删除需二次确认）            |
| 编辑器     | **textarea** — 与工具页 JSON 修复一致，v1 不引入 Monaco                        |
| 页面鉴权   | **A — 复用 `PM2_PAGE_PASSWORD`** — 与 PM2 页共用 unlock 会话；解锁一次两处可用 |
| 模块入口   | 侧栏新模块 **「Mongo」**，id `mongo`                                           |

---

## 3. 目标

| 目标      | 说明                                                        |
| --------- | ----------------------------------------------------------- |
| 集合浏览  | 列出当前库全部集合及文档数量（可选）                        |
| 文档列表  | 分页展示，主列显示 `_id`，副列简短 JSON 预览                |
| JSON 编辑 | 选中文档后在右侧编辑；支持格式化、校验 JSON 语法            |
| 保存      | `PUT` 整文档替换（保留原 `_id`）                            |
| 新建      | `POST` 插入文档（body 为 JSON，可无 `_id` 由 Mongo 生成）   |
| 删除      | `DELETE` 单文档，弹窗确认                                   |
| 未配置库  | `MONGODB_URI` 未设时友好空状态，与 O5 env 一致              |
| 鉴权      | 设了 `PM2_PAGE_PASSWORD` 时进入页面前需解锁；API 写读均校验 |

---

## 4. 非目标（v1）

- 跨库 / 多连接 / 切换 `MONGODB_URI`
- 任意 Mongo 查询语言（filter、aggregation pipeline）
- 字段级 diff、部分更新（`$set`）— v1 仅整文档替换
- Monaco / CodeMirror 语法高亮
- 操作审计日志、版本历史
- 集合级 drop、索引管理
- 独立 `MONGO_PAGE_PASSWORD` 环境变量

---

## 5. 架构

```
浏览器 (Dev Dash /mongo)
    │  fetch + X-PM2-Unlock
    ▼
apps/api  /api/mongo/*
    │  mongoose.connection.db
    ▼
MongoDB（MONGODB_URI 指向的库）
```

### 5.1 鉴权复用

复用 `apps/api/src/pm2/auth.ts` 中已有能力：

- `isPagePasswordRequired()` — 是否配置了 `PM2_PAGE_PASSWORD`
- `verifyPagePassword` / `createUnlockSession` — 解锁（**不新增** `/api/mongo/unlock`；前端继续调 `POST /api/pm2/unlock`）
- `isUnlockSessionValid` — 校验请求头 `X-PM2-Unlock`
- `PM2_API_TOKEN` 若已配置，Bearer 同样可访问 `/api/mongo/*`（与 PM2 一致）

前端：

- 复用 `Pm2UnlockGate`、`getPm2UnlockToken` / `setPm2UnlockToken`
- 新建 `useMongoPageAccess`（或轻量包装）：拉 `/api/mongo/status`，结合本地 unlock token 判断门禁
- `mongo-api.ts` 请求携带与 `pm2-api.ts` 相同的 `X-PM2-Unlock` 头

### 5.2 模块注册

| 步骤 | 位置                                                              |
| ---- | ----------------------------------------------------------------- |
| 1    | `packages/shared/src/index.ts` — `DevDashModuleId` 增加 `"mongo"` |
| 2    | `packages/shared/src/mongo.ts` — 共享 DTO                         |
| 3    | `apps/web/src/app/modules.ts` — 侧栏注册                          |
| 4    | `apps/web/src/pages/mongo/` — 页面与组件                          |
| 5    | `apps/web/src/lib/mongo-api.ts` — 前端 API                        |
| 6    | `apps/api/src/routes/mongo.ts` — 路由                             |
| 7    | `apps/api/src/mongo/` — 集合/文档读写逻辑                         |
| 8    | `apps/api/src/index.ts` — `registerMongoRoutes(app)`              |

---

## 6. 后端 API

前缀 `/api/mongo`。除 `GET /api/mongo/status` 外，均需页面鉴权（当 `PM2_PAGE_PASSWORD` 已配置时）。

### 6.1 接口列表

| 方法   | 路径                    | 说明                                                                      |
| ------ | ----------------------- | ------------------------------------------------------------------------- |
| GET    | `/status`               | `{ configured, databaseName?, pagePasswordRequired }`                     |
| GET    | `/collections`          | `{ collections: { name, count? }[] }`                                     |
| GET    | `/:collection/docs`     | Query: `page`, `limit`（默认 1, 50）；返回 `{ docs, total, page, limit }` |
| GET    | `/:collection/docs/:id` | 单文档；`id` 为字符串化 `_id`                                             |
| PUT    | `/:collection/docs/:id` | Body: 完整 JSON 文档；服务端强制 `_id` 与路径一致                         |
| POST   | `/:collection/docs`     | Body: JSON 文档；插入                                                     |
| DELETE | `/:collection/docs/:id` | 删除单文档                                                                |

### 6.2 `_id` 处理

- 列表与详情：`_id` 序列化为字符串（`ObjectId` → hex，`String`/`Number` 原样 `String()`）
- `GET /:collection/docs/:id`：尝试 `ObjectId.isValid(id) ? new ObjectId(id) : id` 查询
- `PUT`：解析 body JSON，将 `_id` 设为路径 id（兼容 ObjectId 字符串）
- 响应 body 使用 `EJSON` 或手动 `JSON.stringify` + replacer，保证 `ObjectId`、`Date` 可读

### 6.3 安全与校验

- **集合名白名单**：不做硬编码白名单；允许当前库任意集合（内网工具）。禁止集合名含 `.`、`$`、空字符串。
- **文档大小**：单文档 body 上限 **1MB**（`413`）
- **未配置 Mongo**：`503` + `{ message: "MongoDB not configured" }`
- **JSON 非法**：`400` + 解析错误信息

### 6.4 共享类型（`packages/shared/src/mongo.ts`）

```ts
export type MongoStatusResponse = {
  configured: boolean;
  databaseName?: string;
  pagePasswordRequired: boolean;
  message?: string;
};

export type MongoCollectionInfo = { name: string; count?: number };

export type MongoCollectionsResponse = {
  collections: MongoCollectionInfo[];
};

export type MongoDocsResponse = {
  docs: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
};

export type MongoDocResponse = {
  doc: Record<string, unknown>;
};
```

---

## 7. 前端 UI

### 7.1 页面结构

`MongoPage` → 门禁（未配置 / 需密码）→ `MongoPageContent` 三栏布局。

```
┌──────────┬──────────────────┬─────────────────────────┐
│ 集合      │ 文档列表          │ JSON 编辑器              │
│ accounts │ pool             │ [格式化] [保存] [删除]   │
│ systems  │ 674a...          │ textarea                 │
│ kvs      │ ...              │ [新建文档]               │
└──────────┴──────────────────┴─────────────────────────┘
```

### 7.2 交互细节

| 操作   | 行为                                                   |
| ------ | ------------------------------------------------------ |
| 选集合 | 加载第一页文档，清空右侧编辑器                         |
| 选文档 | `GET` 单条，pretty-print 填入 textarea                 |
| 保存   | `JSON.parse` 校验 → `PUT` → toast 成功 / 展示 API 错误 |
| 格式化 | 本地 `JSON.stringify(JSON.parse(text), null, 2)`       |
| 新建   | 清空编辑器为 `{}`，保存时 `POST`                       |
| 删除   | `confirm` → `DELETE` → 刷新列表                        |
| 分页   | 文档列表底部分页器                                     |
| 锁定   | 顶栏「锁定」按钮，复用 PM2 的 lock 逻辑清 token        |

### 7.3 空状态

- `configured: false`：「MongoDB 未配置，请设置 MONGODB_URI」
- 集合为空：「暂无集合」
- 文档为空：「暂无文档，可新建」

### 7.4 组件拆分（建议）

- `MongoPage.tsx` — 门禁壳
- `MongoPageContent.tsx` — 三栏布局与状态
- `MongoCollectionList.tsx`
- `MongoDocList.tsx`
- `MongoDocEditor.tsx` — textarea + 工具栏

---

## 8. 错误处理

| 场景           | 处理                           |
| -------------- | ------------------------------ |
| 401 需密码     | 回到解锁门                     |
| 503 未配置     | 全页空状态                     |
| 400 JSON 无效  | 编辑器上方红色提示，不发起请求 |
| 404 文档不存在 | toast + 刷新列表               |
| 网络错误       | toast + 可重试                 |

---

## 9. 测试与验收

| 检查项                 | 预期                               |
| ---------------------- | ---------------------------------- |
| 无 `MONGODB_URI`       | 状态页提示未配置                   |
| 有库无密码             | 直接进入，可浏览编辑               |
| 有 `PM2_PAGE_PASSWORD` | 需解锁；解锁后 PM2 与 Mongo 均可用 |
| 编辑 accounts pool     | 保存后 O5 env bootstrap 反映变更   |
| 删除文档               | 确认后消失，刷新一致               |
| `pnpm check`           | 通过                               |
| `react-doctor`         | 100 分                             |

---

## 10. 环境变量

无新增变量。沿用：

| 变量                | 作用                           |
| ------------------- | ------------------------------ |
| `MONGODB_URI`       | Mongo 连接                     |
| `PM2_PAGE_PASSWORD` | 页面密码（PM2 + Mongo 共用）   |
| `PM2_API_TOKEN`     | 可选 API Bearer（与 PM2 共用） |

---

## 11. 后续可选（v1.1+）

- Monaco 编辑器 + JSON 高亮
- 查询 filter（JSON 输入 `{ "name": "O5" }`）
- 导出集合为 JSONL
- 操作历史 / 软删除
