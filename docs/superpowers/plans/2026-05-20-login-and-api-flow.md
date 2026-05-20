# 登录与 API 联调 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 env-share（`login-and-api-flow.md`）的 MongoDB 数据层、自有写接口、外部登录跳转逻辑迁移到 mt-dev monorepo：Hono API + React O5 Env，替换 mock 与占位 `openAccountPage`。

**Architecture:** 后端复用 env-share 的 `kvs` 集合与 `value` 结构（`urlList` + `accountList`），通过 `GET /api/o5-env/*` 聚合为 O5 页面所需的「系统 → 环境 → 账号」树；账号在 KV 维度与 env-share 一致（系统级 `accountList`，环境仅决定跳转 `url`）。前端在浏览器直连 `https://env.lif3ng.cn:3443` 完成 login → authCode → `window.open`（与原文一致，`/api/login` 代理留作 CORS 兜底）。本地 UI 状态（上次环境、置顶）继续用 localStorage，权威数据来自 API。

**Tech Stack:** Hono 4、mongoose、React 19、react-router、@mt-dev/shared、Vite+ `vp check`

**Spec:** `docs/superpowers/login-and-api-flow.md`  
**Related:** `docs/superpowers/specs/2026-05-19-o5-env-prd.md`（F-13 API 联调）

**Status:** ✅ 已完成（PR-A/B/C：shared、API、前端跳转、写操作 UI、登录代理）

---

## 架构决策（实施前确认）

| 项          | env-share                      | 当前 O5 mock    | 本计划选择                                                                        |
| ----------- | ------------------------------ | --------------- | --------------------------------------------------------------------------------- |
| 账号归属    | 系统级 `accountList`           | 按 `envId` 过滤 | **系统级**；选中环境只影响 `currentUrlConfig.url`，账号列表对该系统下所有环境相同 |
| 企业信息    | `corpList: { corpId, name }[]` | 单字段 `org`    | 扩展为 `corpList`，UI 单企业时整块跳转、多企业时点标签跳转                        |
| 密码        | 存 MongoDB                     | mock 无密码     | API 返回给前端用于跳转（内网工具，与 env-share 一致）                             |
| 外部登录    | 浏览器直连                     | 无              | **Phase 3 直连**；若遇 CORS 再加 `POST /api/o5-env/login-proxy`                   |
| 分享/导入页 | `/s/{slug}` Astro SSR          | 无              | **Out of scope v1**；写接口先实现，分享路由后续独立 PR                            |

---

## File map

| 文件                                                  | 职责                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `packages/shared/src/o5-env.ts`                       | KV、`Corp`、`UrlConfig`、`AccountJumpPayload` 等共享类型        |
| `packages/shared/src/index.ts`                        | re-export                                                       |
| `apps/api/.env.example`                               | `MONGODB_URI`                                                   |
| `apps/api/src/db/mongo.ts`                            | 连接 + `KvModel`                                                |
| `apps/api/src/db/kv.ts`                               | `getKvList` / `getKv` / `setKv` / `addUserToKv` / `addLinkToKv` |
| `apps/api/src/routes/o5-env.ts`                       | 读聚合 + 写接口 + recommend 代理                                |
| `apps/api/src/index.ts`                               | 挂载路由、Mongo 启动                                            |
| `apps/web/src/lib/external-login.ts`                  | 外部 login / org / authCode                                     |
| `apps/web/src/lib/account-jump.ts`                    | `buildJumpUrl` + `openAccountJump`（windowName 规则）           |
| `apps/web/src/hooks/useO5EnvData.ts`                  | fetch bootstrap、loading/error                                  |
| `apps/web/src/types/o5-env.ts`                        | 前端视图类型（可由 shared 映射）                                |
| `apps/web/src/mocks/o5-env.ts`                        | 保留为 fallback / story                                         |
| `apps/web/src/pages/o5-env/O5EnvPage.tsx`             | 接 API + 传 `urlConfig`                                         |
| `apps/web/src/components/o5-env/AccountCard.tsx`      | 点击跳转、corp 标签                                             |
| `apps/web/src/components/o5-env/AccountCardList.tsx`  | 绑定 jump handler                                               |
| `apps/web/src/components/o5-env/FavoritesSection.tsx` | chip 跳转改用 `account-jump`                                    |
| `apps/web/src/lib/open-account-page.ts`               | 删除或改为 deprecated 包装                                      |

---

## Phase 0: 共享类型与环境变量

### Task 0: Shared types + env

**Files:**

- Create: `packages/shared/src/o5-env.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/api/.env.example`
- Modify: `apps/api/package.json`

- [ ] **Step 1: 添加 `packages/shared/src/o5-env.ts`**

```ts
export type Corp = {
  corpId: string;
  name: string;
};

export type UrlConfig = {
  url: string;
  note: string;
  features?: string;
};

export type KvAccount = {
  username: string;
  password: string;
  name: string;
  corpList: Corp[];
};

export type KvValue = {
  urlList: UrlConfig[];
  accountList: KvAccount[];
};

export type KvDocument = {
  id: string;
  alias: string;
  value: KvValue;
};

/** O5 页面聚合后的系统 */
export type O5SystemDto = {
  id: string;
  name: string;
  environments: O5EnvironmentDto[];
  accounts: O5AccountDto[];
};

export type O5EnvironmentDto = {
  id: string;
  name: string;
  url: string;
  features?: string;
};

export type O5AccountDto = {
  id: string;
  username: string;
  password: string;
  name: string;
  corpList: Corp[];
};

export type O5EnvBootstrapResponse = {
  systems: O5SystemDto[];
};

export type AccountJumpRequest = {
  username: string;
  password: string;
  corpId: string;
  targetUrl: string;
  features?: string;
  ctrlKey?: boolean;
};

export type ShareNewRequest = {
  key?: string;
  urlList: UrlConfig[];
  accountList: KvAccount[];
};

export type ShareNewResponse = { slug: string };

export type AddUserRequest = {
  kvId: string;
  username: string;
  name: string;
  password: string;
  corpList: Corp[];
};

export type AddLinkRequest = {
  kvId: string;
  url: string;
  note?: string;
};
```

- [ ] **Step 2: `index.ts` 导出**

```ts
export * from "./o5-env.js";
```

- [ ] **Step 3: API 依赖 mongoose**

`apps/api/package.json` dependencies 增加：

```json
"mongoose": "^8.19.1"
```

- [ ] **Step 4: `.env.example`**

```
MONGODB_URI=mongodb://192.168.5.46:27017/env
EXTERNAL_LOGIN_BASE=https://env.lif3ng.cn:3443
RECOMMEND_UPSTREAM=http://192.168.5.46:3000
```

- [ ] **Step 5: 安装并类型检查**

```bash
cd /Users/nic/w/mt-dev && pnpm install && pnpm check
```

Expected: 无 TS 错误。

---

## Phase 1: 后端 MongoDB 数据层

### Task 1: Mongo 连接与 KV 模型

**Files:**

- Create: `apps/api/src/db/mongo.ts`
- Create: `apps/api/src/db/kv.ts`

- [ ] **Step 1: `mongo.ts`**

```ts
import mongoose, { Schema } from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is required");
}

await mongoose.connect(uri);

const kvSchema = new Schema({
  alias: String,
  value: Object,
});

export const KvModel = mongoose.model("KV", kvSchema);
```

- [ ] **Step 2: `kv.ts`（与 spec 8.1 一致）**

实现：`getKvList`、`getKv`（ObjectId 或 alias）、`setKv`、`addUserToKv`（409 username 重复）、`addLinkToKv`；修改 `value` 后 `markModified("value")`。

- [ ] **Step 3: 本地冒烟（需内网 Mongo）**

```bash
cd /Users/nic/w/mt-dev/apps/api && MONGODB_URI=mongodb://192.168.5.46:27017/env pnpm dev
```

另开终端：`curl -s http://localhost:6333/api/health` → `{"status":"ok"}`。

---

### Task 2: O5 读接口 — bootstrap

**Files:**

- Create: `apps/api/src/routes/o5-env.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: 映射函数 `kvDocToSystem`**

规则：

- `id` = `_id.toString()`，`name` = `alias`
- `environments` = `value.urlList.map((u, i) => ({ id: \`${alias}-env-${i}\`, name: u.note, url: u.url, features: u.features }))`
- `accounts` = `value.accountList.map((a, i) => ({ id: \`${alias}-acc-${a.username}\`, ...a }))`

- [ ] **Step 2: `GET /api/o5-env/bootstrap`**

```ts
app.get("/api/o5-env/bootstrap", async (c) => {
  const list = await getKvList();
  const systems = list.map((doc) => kvDocToSystem(doc)).filter((s) => s.name);
  return c.json({ systems } satisfies O5EnvBootstrapResponse);
});
```

- [ ] **Step 3: `index.ts` 仅在 `MONGODB_URI` 存在时 import db**

开发无 Mongo 时 health 仍可用；bootstrap 返回 503 + `{ message: "MongoDB not configured" }`。

- [ ] **Step 4: 验证**

```bash
curl -s http://localhost:6333/api/o5-env/bootstrap | head -c 500
```

Expected: JSON 含 `systems` 数组，结构与 mock 可对照。

---

### Task 3: 写接口（parity env-share）

**Files:**

- Modify: `apps/api/src/routes/o5-env.ts`

- [ ] **Step 1: `POST /api/share/new`**

Body: `ShareNewRequest`；`setKv(key, value)`；响应 `{ slug: alias || _id }`（与 spec 3.1 一致）。

- [ ] **Step 2: `POST /api/user/add`**

校验 `kvId/username/name/password`；`addUserToKv`；状态码 201/400/404/409/500 与 spec 3.2 表一致。

- [ ] **Step 3: `POST /api/link/add`**

校验 `kvId/url`；`addLinkToKv`；201/400/404/500。

- [ ] **Step 4: `GET /api/recommend/:env`**

`env` ∈ `test|dev|prod`；代理 `RECOMMEND_UPSTREAM/api/recommend?env=`；对每个 url 请求 `/build_version` 附加字段 `v`（逻辑照抄 spec 8.3 recommend 路由）。

- [ ] **Step 5: curl 冒烟 add link**

```bash
curl -s -X POST http://localhost:6333/api/link/add \
  -H 'Content-Type: application/json' \
  -d '{"kvId":"测试","url":"https://example.com/login","note":"冒烟环境"}'
```

Expected: `success: true` 或 404（KV 不存在时）。

---

## Phase 2: 前端外部登录与跳转

### Task 4: `external-login.ts`

**Files:**

- Create: `apps/web/src/lib/external-login.ts`

- [ ] **Step 1: 常量与 headers**

```ts
const BASE = "https://env.lif3ng.cn:3443";
const APP_HEADERS = { clientType: "app" } as const;
```

- [ ] **Step 2: 实现三个函数**

```ts
export async function loginApp(
  username: string,
  password: string,
): Promise<{ access_token: string; name: string }>;
export async function fetchCorpList(accessToken: string): Promise<Corp[]>;
export async function fetchAuthCode(accessToken: string): Promise<string>;
```

- URL 与 spec §2 一致；`fetchCorpList` 映射 `corpUsers` → `{ corpId, name }`；失败抛 `Error` 带简短中文信息。

- [ ] **Step 3: 手动验证（浏览器 console 或临时页面）**

用真实测试号调用 `loginApp` → `fetchAuthCode`，确认非 CORS 错误。

---

### Task 5: `account-jump.ts`

**Files:**

- Create: `apps/web/src/lib/account-jump.ts`

- [ ] **Step 1: `buildJumpUrl(targetUrl, userCode, corpId)`**

解析 `targetUrl`，保留原有 search，追加 `userCode`、`corpId`（spec §6）。

- [ ] **Step 2: `resolveWindowName(ctrlKey, corpId, username, targetUrl)`**

| 条件    | 返回值                                                   |
| ------- | -------------------------------------------------------- |
| ctrlKey | `page-${Date.now()}-${random}`                           |
| 默认    | `page-${corpId}-${username}-${url.replace(/[:/]/g,"_")}` |

- [ ] **Step 3: `openAccountJump(payload: AccountJumpRequest)`**

```ts
export async function openAccountJump(payload: AccountJumpRequest): Promise<void> {
  const token = await loginApp(payload.username, payload.password);
  const code = await fetchAuthCode(token.access_token);
  const url = buildJumpUrl(payload.targetUrl, code, payload.corpId);
  const name = resolveWindowName(
    !!payload.ctrlKey,
    payload.corpId,
    payload.username,
    payload.targetUrl,
  );
  window.open(url, name, payload.features ?? "noopener,noreferrer");
}
```

- [ ] **Step 4: 错误 UX**

捕获异常 → `console.error` + `alert("跳转失败，请重试")`；`targetUrl` 为空 → `alert("请先选择一个环境")`。

---

### Task 6: 扩展账号类型与卡片交互

**Files:**

- Modify: `apps/web/src/mocks/o5-env.ts`（类型迁出到 `types/o5-env.ts` 亦可）
- Modify: `apps/web/src/components/o5-env/AccountCard.tsx`
- Modify: `apps/web/src/components/o5-env/AccountCardList.tsx`
- Modify: `apps/web/src/components/o5-env/FavoritesSection.tsx`

- [ ] **Step 1: `O5Account` 扩展**

```ts
export type O5Account = {
  id: string;
  username: string;
  password: string;
  name: string;
  corpList: { corpId: string; name: string }[];
};
```

移除 mock 对 `envId` 的强依赖（或保留 `envId` 仅用于 UI 分组占位，bootstrap 映射时设为 `systemId`）。

- [ ] **Step 2: AccountCard 跳转规则（对齐 AccountItem.vue）**

Props 增加：`targetUrl: string | null`、`features?: string`、`onJump: (payload) => void`。

- 单企业（`corpList.length === 1`）：卡片根节点 `onClick` → jump
- 多企业：展示可点击 corp chip，`onClick` → jump；根节点不跳转
- 传递 `ctrlKey/metaKey` 自 `MouseEvent`

- [ ] **Step 3: AccountCardList 传入 `currentUrlConfig`**

从 `O5EnvPage` 接收 `environment.url` + `features`；`onJump` 内调用 `openAccountJump`。

- [ ] **Step 4: FavoritesSection chip 点击**

`handleOpen` 改为与 AccountCard 相同 jump（需 `corpList[0]` 或用户上次选择 — v1 默认第一个 corp）。

- [ ] **Step 5: 删除 `open-account-page.ts` 端口猜测逻辑**

全局 grep `openAccountPage` 确保无残留。

---

## Phase 3: O5 页面接 API

### Task 7: `useO5EnvData` + 页面接线

**Files:**

- Create: `apps/web/src/hooks/useO5EnvData.ts`
- Modify: `apps/web/src/pages/o5-env/O5EnvPage.tsx`

- [ ] **Step 1: Hook**

```ts
export function useO5EnvData() {
  // GET /api/o5-env/bootstrap
  // return { systems, environmentsBySystem, accountsBySystem, loading, error, refetch }
}
```

`environmentsBySystem` / `accountsBySystem` 由 bootstrap 派生；无 Mongo 时可 `import { o5Systems, ... } from mocks` 作为 fallback（`import.meta.env.DEV` + 503）。

- [ ] **Step 2: O5EnvPage 替换 mock import**

- 系统列表 ← `systems`
- 环境列表 ← 当前系统的 `environments`
- 账号列表 ← 当前系统的 `accounts`（**不按 envId 过滤**，与 env-share 一致）
- `selectedEnvironment` 提供 `url` / `features` 给 AccountCardList

- [ ] **Step 3: localStorage 缓存（可选，对齐 spec §4.8）**

Key `o5-env-cache`：`lastActiveSystem`、`systems[alias].lastActiveUrl`；切换系统时恢复环境选中。

- [ ] **Step 4: 加载/错误态（PRD F-14 最小版）**

Loading：侧栏 skeleton 或文案；Error：展示 message +「重试」按钮调 `refetch`。

- [ ] **Step 5: 端到端验证**

```bash
cd /Users/nic/w/mt-dev && pnpm dev
```

1. 打开 `http://localhost:6111/o5-env`
2. 选系统与环境
3. 点击单企业账号卡片 → 新窗口 URL 含 `userCode` 与 `corpId`
4. Cmd+点击 → 每次新窗口名

```bash
pnpm check
```

Expected: 全部通过。

---

## Phase 4: 写操作 UI

### Task 8: 添加用户 / 添加链接

**Files:**

- `apps/web/src/components/o5-env/EnvironmentList.tsx`
- `apps/web/src/components/o5-env/AddUserDialog.tsx`
- `apps/web/src/components/o5-env/AddLinkDialog.tsx`
- `apps/web/src/lib/o5-env-api.ts`

- [x] 表单 Modal：提交 `POST /api/user/add`、`POST /api/link/add`；成功后 `refetch()` bootstrap。

### Task 9: 同步环境 recommend

- [x] 环境列表「同步」按钮：`GET /api/recommend/test` → 批量 `POST /api/link/add`。

### Task 10: 登录代理

- [x] `POST /api/o5-env/login-proxy`；`external-login.ts` 直连失败时回退代理。

---

## 测试与验证清单

| 场景                      | 预期                                            |
| ------------------------- | ----------------------------------------------- |
| 无 `MONGODB_URI` 启动 API | `/api/health` 正常，`/api/o5-env/bootstrap` 503 |
| 有 Mongo                  | bootstrap 返回真实系统列表                      |
| 未选环境点击账号          | alert 请先选择环境                              |
| 外部 login 失败           | alert 跳转失败                                  |
| 单企业账号                | 整块可点                                        |
| 多企业账号                | 仅 corp 标签可点                                |
| Cmd+点击                  | 新 window name                                  |
| add user 重复 username    | 409 JSON                                        |
| `pnpm check`              | 0 error                                         |

---

## Spec 覆盖自检

| Spec 章节           | 任务                  |
| ------------------- | --------------------- |
| §2 外部登录 API     | Task 4, 5             |
| §3.1 share/new      | Task 3 Step 1         |
| §3.2 user/add       | Task 3 Step 2, Task 8 |
| §3.3 link/add       | Task 3 Step 3, Task 8 |
| §3.4 recommend      | Task 3 Step 4, Task 9 |
| §3.5 login 代理空   | Task 10 按需          |
| §4 Mongo / KV       | Task 1, 2             |
| §4.8 localStorage   | Task 7 Step 3         |
| §5 跳转逻辑         | Task 5, 6             |
| §5 AccountItem corp | Task 6                |
| §6 URL 参数         | Task 5 Step 1         |
| 分享页 AccountList  | Out of scope v1       |
| 导入页 clipboard    | Out of scope v1       |

---

## 建议实施顺序（单 PR 或多 PR）

1. **PR-A**：Task 0–3（shared + API 全套路由）
2. **PR-B**：Task 4–7（跳转 + O5 接 API）— 可演示主路径
3. **PR-C**：Task 8–10（写操作与 recommend）

---

## 风险与缓解

| 风险                                 | 缓解                                                    |
| ------------------------------------ | ------------------------------------------------------- |
| 浏览器 CORS 拦外部登录               | Task 10 代理；或内网浏览器策略                          |
| O5 mock 按 env 分账号与 Mongo 不一致 | 本计划改为系统级账号；更新 PRD F-13 说明                |
| 密码经 API 到前端                    | 内网 Dev Dash，与 env-share 相同；禁止日志打印 password |
| Mongo 不可达                         | dev fallback mock + 503 明确提示                        |
