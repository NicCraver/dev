# YApi 接口调试台 — 设计

日期：2026-07-27

## 背景

YApi 模块目前只做文档浏览。需要在已登录 YApi 的前提下，用 O5 业务账号拿 token，对文档接口发真实请求，并在页面内查看回参。

## 目标

1. 用 O5 env 账号登录，持久化 `access_token`（及当前账号标识）。
2. 选择目标环境（测试 / 生产），默认测试。
3. 从 YApi 项目选择接口，或从接口详情一键跳入。
4. 可编辑 path / query / headers / body，发送请求，页内展示 status、耗时、response headers、body。
5. 不依赖浏览器 Network；请求经 API 代理转发以规避 CORS。

## 非目标（MVP）

- 不实现 file/multipart 上传。
- 不实现请求历史、断言、集合 Runner。
- 不新增侧栏独立模块；挂在 YApi 内。
- 不直连目标 host（一律走后端代理）。

## 环境配置（写死）

| id     | 标签 | baseURL                         |
| ------ | ---- | ------------------------------- |
| `test` | 测试 | `http://192.168.10.25`          |
| `prod` | 生产 | `https://zhixin.zhiguaniot.com` |

默认 `test`。可切换；上次选择写入 localStorage。

## 入口

1. **独立页** `/yapi/debug`（需 YApi 登录）。
2. **接口详情**「调试」按钮 → `/yapi/debug?project=<projectId>&iface=<interfaceId>`，自动选中该接口并预填参数。

## 布局

```
顶栏：环境切换 | O5 账号选择 / 登录态 | 登出
左栏：项目下拉 + 分类/接口列表（可搜索）
右栏：请求编辑区 + 发送 + 响应展示
```

## 登录态

- 账号来源：`GET /api/o5-env/bootstrap` 聚合出的账号列表（去重 username）。
- 登录：复用 `loginApp(username, password)` → `access_token`。
- 持久化 key：`mt-dev:yapi-debug:auth` → `{ username, name, accessToken }`；`mt-dev:yapi-debug:env` → `"test" | "prod"`。
- 发请求时自动注入 `Authorization: Bearer <accessToken>`（用户可在 Headers 编辑器覆盖同名头）。
- 未登录时可编辑参数，发送前提示先登录。

## 请求构建

从 `IfaceItem`（或 `getInterface` 后转换）预填：

- method、path（pathParams 用 example 或空字符串替换 `:id` / `{id}`）
- query：name → example
- headers：文档头 + Content-Type（有 JSON body 时默认 `application/json`）
- body：`body.example` 的 JSON 字符串；无 body 的方法留空

用户可改 URL path、各 KV、body 文本。最终 URL = `baseURL + path + ?query`。

## 后端代理

`POST /api/http-proxy`

请求体：

```ts
{
  url: string;           // 完整 URL，必须落在白名单 host
  method: string;
  headers?: Record<string, string>;
  body?: string;         // 原始字符串；无 body 时省略
}
```

响应：

```ts
{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string; // 文本；二进制以 base64 不在 MVP
  durationMs: number;
}
```

白名单 host：`192.168.10.25`、`zhixin.zhiguaniot.com`（及对应默认端口）。拒绝其他目标，返回 400。

超时：30s。错误：502 + message。

## 前端模块划分

| 文件                                | 职责                           |
| ----------------------------------- | ------------------------------ |
| `lib/yapi-debug-env.ts`             | 环境常量、localStorage         |
| `lib/yapi-debug-auth.ts`            | token 读写                     |
| `lib/yapi-debug-request.ts`         | 从 IfaceItem 预填、拼 URL      |
| `lib/http-proxy-api.ts`             | 调 `/api/http-proxy`           |
| `hooks/useYapiDebugAuth.ts`         | 登录/登出/账号列表             |
| `pages/yapi/YapiDebugPage.tsx`      | 页面组装                       |
| `components/yapi/YapiDebug*.tsx`    | 顶栏、侧栏、请求编辑、响应面板 |
| `apps/api/src/routes/http-proxy.ts` | 代理路由                       |

## 错误处理

- 代理失败：响应区展示错误文案。
- token 失效（业务 401）：提示重新登录，不自动清 YApi 会话。
- YApi 未登录：走现有 `YapiRequireAuth`。

## 成功标准

- 选测试环境 + O5 账号登录后，可对某接口改参发送并看到 JSON 回参。
- 详情页「调试」能带上对应接口。
- 生产环境切换后请求打到生产 host。
- 代理拒绝非白名单 URL。
