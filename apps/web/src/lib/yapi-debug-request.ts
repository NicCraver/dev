import type { HttpMethod, IfaceItem } from "@/lib/yapi-types";

export type KvPair = { key: string; value: string };

export type YapiDebugDraft = {
  method: HttpMethod;
  path: string;
  query: KvPair[];
  headers: KvPair[];
  bodyText: string;
};

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

export function buildDebugDraft(iface: IfaceItem): YapiDebugDraft {
  const query = (iface.query || []).map((q) => ({
    key: q.name,
    value: q.example != null ? String(q.example) : "",
  }));

  const pathParams = (iface.pathParams || []).map((p) => ({
    key: p.name,
    value: p.example != null ? String(p.example) : "",
  }));

  const headers: KvPair[] = (iface.headers || [])
    .filter((h) => h.name && h.name.toLowerCase() !== "authorization")
    .map((h) => ({
      key: h.name,
      value: h.example != null ? String(h.example) : "",
    }));

  const method = iface.method;
  const hasJsonBody = !!iface.body && method !== "GET" && method !== "DELETE";
  if (hasJsonBody && !headers.some((h) => h.key.toLowerCase() === "content-type")) {
    headers.push({ key: "Content-Type", value: "application/json" });
  }

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

export function mergeAuthHeader(
  headers: KvPair[],
  accessToken: string | null,
): Record<string, string> {
  const record = kvToRecord(headers);
  const hasAuth = Object.keys(record).some((k) => k.toLowerCase() === "authorization");
  if (!hasAuth && accessToken) {
    record.Authorization = `Bearer ${accessToken}`;
  }
  return record;
}
