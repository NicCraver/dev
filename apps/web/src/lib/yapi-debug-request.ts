import type { HttpMethod, IfaceItem } from "@/lib/yapi-types";
import type { YapiDebugAuthSession } from "@/lib/yapi-debug-auth";

export type KvPair = { key: string; value: string };

export type YapiDebugDraft = {
  method: HttpMethod;
  path: string;
  query: KvPair[];
  headers: KvPair[];
  bodyText: string;
};

/** 对齐 dev-o5-shortcut axiosInstance 默认头 */
export const O5_DEFAULT_HEADERS = {
  "Content-Type": "application/json;charset=utf-8",
  version: "v1",
  clientType: "app",
} as const;

const O5_HEADER_KEYS = new Set(
  ["content-type", "version", "clienttype", "authorization", "zxcorpid"].map((k) => k),
);

function stringifyExample(example: unknown): string {
  if (example == null || example === "") return "";
  if (typeof example === "string") return example;
  if (typeof example === "number" || typeof example === "boolean") return String(example);
  try {
    return JSON.stringify(example, null, 2);
  } catch {
    return "";
  }
}

/** 将 path 中的 `:id` / `{id}` 用 pathParams 的 example 替换 */
export function applyPathParams(path: string, pathParams: KvPair[]): string {
  let result = path;
  for (const { key, value } of pathParams) {
    if (!key) continue;
    const encoded = encodeURIComponent(value);
    result = result
      .replace(new RegExp(`:${key}(?=/|$)`, "g"), encoded)
      .replace(new RegExp(`\\{${key}\\}`, "g"), encoded);
  }
  return result;
}

function stripO5ManagedHeaders(headers: KvPair[]): KvPair[] {
  return headers.filter((h) => !O5_HEADER_KEYS.has(h.key.trim().toLowerCase()));
}

/** 生成可编辑的 O5 标准 Headers（未登录时 token/corp 留空占位） */
export function buildO5HeaderPairs(session: YapiDebugAuthSession | null): KvPair[] {
  const clientType = session?.clientType || O5_DEFAULT_HEADERS.clientType;
  return [
    { key: "Content-Type", value: O5_DEFAULT_HEADERS["Content-Type"] },
    { key: "version", value: O5_DEFAULT_HEADERS.version },
    { key: "clientType", value: clientType },
    {
      key: "Authorization",
      value: session?.accessToken ? `Bearer ${session.accessToken}` : "Bearer ",
    },
    { key: "zxCorpId", value: session?.corpId || "" },
  ];
}

export function buildDebugDraft(
  iface: IfaceItem,
  session: YapiDebugAuthSession | null = null,
): YapiDebugDraft {
  const query = (iface.query || []).map((q) => ({
    key: q.name,
    value: q.example != null ? String(q.example) : "",
  }));

  const pathParams = (iface.pathParams || []).map((p) => ({
    key: p.name,
    value: p.example != null ? String(p.example) : "",
  }));

  const fromDoc: KvPair[] = [];
  for (const h of iface.headers || []) {
    if (!h.name) continue;
    fromDoc.push({
      key: h.name,
      value: h.example != null ? String(h.example) : "",
    });
  }
  const headers = [...buildO5HeaderPairs(session), ...stripO5ManagedHeaders(fromDoc)];

  const method = iface.method;
  const hasJsonBody = !!iface.body && method !== "GET" && method !== "DELETE";
  const bodyText = hasJsonBody ? stringifyExample(iface.body?.example) : "";

  return {
    method,
    path: applyPathParams(iface.path, pathParams),
    query,
    headers,
    bodyText,
  };
}

export function composeRequestUrl(
  baseURL: string,
  path: string,
  query: KvPair[],
  projectBasepath?: string,
): string {
  const root = baseURL.replace(/\/$/, "");
  const bp = (projectBasepath || "").replace(/\/$/, "");
  let p = path.trim() || "/";
  if (!p.startsWith("/")) p = `/${p}`;
  if (bp && bp !== "/" && !p.startsWith(bp)) {
    p = `${bp}${p}`;
  }

  const url = new URL(`${root}${p}`);
  for (const { key, value } of query) {
    if (!key) continue;
    url.searchParams.append(key, value);
  }
  return url.toString();
}

export function kvToRecord(pairs: KvPair[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value } of pairs) {
    if (!key.trim()) continue;
    out[key.trim()] = value;
  }
  return out;
}

/**
 * 合并发送用 Headers：以编辑器为准，并确保 shortcut 必需头存在。
 * Authorization / zxCorpId / clientType 在编辑器未填时用 session 补齐。
 */
export function mergeO5Headers(
  headers: KvPair[],
  session: YapiDebugAuthSession | null,
): Record<string, string> {
  const record = kvToRecord(headers);

  const lower = (name: string) =>
    Object.keys(record).find((k) => k.toLowerCase() === name.toLowerCase());

  if (!lower("Content-Type")) {
    record["Content-Type"] = O5_DEFAULT_HEADERS["Content-Type"];
  }
  if (!lower("version")) {
    record.version = O5_DEFAULT_HEADERS.version;
  }

  const clientKey = lower("clientType");
  if (!clientKey) {
    record.clientType = session?.clientType || O5_DEFAULT_HEADERS.clientType;
  } else if (!record[clientKey]) {
    record[clientKey] = session?.clientType || O5_DEFAULT_HEADERS.clientType;
  }

  const authKey = lower("Authorization");
  if (session?.accessToken) {
    if (!authKey) {
      record.Authorization = `Bearer ${session.accessToken}`;
    } else if (!record[authKey]?.replace(/^Bearer\s*/i, "").trim()) {
      record[authKey] = `Bearer ${session.accessToken}`;
    }
  }

  const corpKey = lower("zxCorpId");
  if (session?.corpId) {
    if (!corpKey) {
      record.zxCorpId = session.corpId;
    } else if (!record[corpKey]?.trim()) {
      record[corpKey] = session.corpId;
    }
  }

  return record;
}
