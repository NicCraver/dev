# YApi 接口调试台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 YApi 模块内提供调试页：O5 账号登录持久化、选测试/生产环境、选接口、改参发送、页内看回参。

**Architecture:** 前端 `/yapi/debug` 组装请求；`POST /api/http-proxy` 仅转发白名单 host；O5 token 存在 localStorage，请求头自动带 Bearer。

**Tech Stack:** React 19、Hono、现有 `loginApp` / YApi `getInterface` / `convertYapiData`。

## Global Constraints

- 环境写死：test=`http://192.168.10.25`，prod=`https://zhixin.zhiguaniot.com`，默认 test
- MVP 仅 JSON/文本 body，无 file 上传
- 代理必须白名单校验
- 中文 UI 文案

---

### Task 1: HTTP 代理路由

**Files:**

- Create: `apps/api/src/routes/http-proxy.ts`
- Modify: `apps/api/src/index.ts`

**Interfaces:**

- Produces: `POST /api/http-proxy` → `{ status, statusText, headers, body, durationMs }`

- [ ] **Step 1: 实现白名单代理**

```ts
// apps/api/src/routes/http-proxy.ts
import type { Hono } from "hono";

const ALLOWED_HOSTS = new Set(["192.168.10.25", "zhixin.zhiguaniot.com"]);

type ProxyBody = {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export function registerHttpProxyRoutes(app: Hono) {
  app.post("/api/http-proxy", async (c) => {
    let payload: ProxyBody;
    try {
      payload = (await c.req.json()) as ProxyBody;
    } catch {
      return c.json({ message: "Invalid JSON body" }, 400);
    }

    const rawUrl = payload.url?.trim();
    if (!rawUrl) return c.json({ message: "url is required" }, 400);

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return c.json({ message: "Invalid url" }, 400);
    }

    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return c.json({ message: `Host not allowed: ${parsed.hostname}` }, 400);
    }

    const method = (payload.method ?? "GET").toUpperCase();
    const headers = new Headers();
    for (const [k, v] of Object.entries(payload.headers ?? {})) {
      if (!k || v == null) continue;
      const lower = k.toLowerCase();
      if (lower === "host" || lower === "content-length") continue;
      headers.set(k, String(v));
    }

    const hasBody =
      method !== "GET" && method !== "HEAD" && payload.body != null && payload.body !== "";
    const started = Date.now();
    try {
      const upstream = await fetch(parsed.toString(), {
        method,
        headers,
        body: hasBody ? payload.body : undefined,
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      const text = await upstream.text();
      const resHeaders: Record<string, string> = {};
      upstream.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });
      return c.json({
        status: upstream.status,
        statusText: upstream.statusText,
        headers: resHeaders,
        body: text,
        durationMs: Date.now() - started,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Proxy request failed";
      return c.json({ message, durationMs: Date.now() - started }, 502);
    }
  });
}
```

在 `index.ts` 注册：`registerHttpProxyRoutes(app)`。

- [ ] **Step 2: 验证**

Run: `pnpm --filter @mt-dev/api check`（或根 `pnpm check` 中 api 部分）

---

### Task 2: 前端 debug 基础库

**Files:**

- Create: `apps/web/src/lib/yapi-debug-env.ts`
- Create: `apps/web/src/lib/yapi-debug-auth.ts`
- Create: `apps/web/src/lib/yapi-debug-request.ts`
- Create: `apps/web/src/lib/http-proxy-api.ts`

- [ ] **Step 1: 环境与 auth storage、请求预填、proxy client**（按 design 实现）

`buildDebugDraft(iface)` → `{ method, path, query, headers, bodyText }`  
`composeRequestUrl(baseURL, path, query)`  
`sendViaProxy({ url, method, headers, body })`

---

### Task 3: Debug 页面 UI + 路由 + 详情入口

**Files:**

- Create: `apps/web/src/hooks/useYapiDebugAuth.ts`
- Create: `apps/web/src/pages/yapi/YapiDebugPage.tsx`
- Create: `apps/web/src/components/yapi/YapiDebugToolbar.tsx`
- Create: `apps/web/src/components/yapi/YapiDebugIfacePicker.tsx`
- Create: `apps/web/src/components/yapi/YapiDebugRequestEditor.tsx`
- Create: `apps/web/src/components/yapi/YapiDebugResponsePanel.tsx`
- Modify: `apps/web/src/pages/yapi/YapiPage.tsx`
- Modify: `apps/web/src/components/yapi/YapiInterfaceDetail.tsx`
- Modify: `apps/web/src/pages/yapi/YapiProjectListPage.tsx`（加「调试」导航入口）

- [ ] **Step 1: 实现页面与接线**
- [ ] **Step 2: `vp check` + `npx -y react-doctor@latest .` 至 100**

---

### Task 4: 文档与收尾

- [ ] 如需更新 `AGENTS.md` 一行说明调试能力
- [ ] Commit（用户已授权完成任务时提交）
