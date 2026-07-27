export const YAPI_API_PREFIX = "/api/yapi";

export class YapiError extends Error {
  readonly errcode: number;
  constructor(errcode: number, message: string) {
    super(message);
    this.name = "YapiError";
    this.errcode = errcode;
  }
}

export class YapiAuthError extends YapiError {
  constructor(message = "未登录") {
    super(40011, message);
    this.name = "YapiAuthError";
  }
}

export class YapiNetworkError extends Error {
  constructor(message = "无法连接 YApi 服务，请检查 SSH 转发或 /api/yapi 代理是否可达") {
    super(message);
    this.name = "YapiNetworkError";
  }
}

interface YapiEnvelope<T> {
  errcode?: number;
  errmsg?: string;
  data?: T;
}

export interface YapiUser {
  _id?: number;
  id?: number;
  username?: string;
  email?: string;
  role?: string;
}

export interface YapiProject {
  _id: number;
  name: string;
  desc?: string;
  basepath?: string;
  group_id?: number;
  group_name?: string;
}

export interface YapiGroup {
  _id: number;
  group_name: string;
  project_list?: YapiProject[];
}

export interface YapiListItem {
  _id: number;
  title: string;
  path: string;
  method: string;
  catid: number;
  status?: string;
  desc?: string;
  tag?: string[];
  up_time?: number;
  username?: string;
  uid?: number;
}

export interface YapiMenuCat {
  _id: number;
  name: string;
  desc?: string;
  list?: YapiListItem[];
}

export interface YapiInterfaceDetail {
  _id?: number;
  id?: number;
  title?: string;
  method?: string;
  path?: string;
  status?: string;
  desc?: string;
  tag?: string[];
  up_time?: number | string;
  username?: string;
  uid?: number | string;
  catid?: number;
  req_headers?: unknown[];
  req_query?: unknown[];
  req_params?: unknown[];
  req_body_type?: string;
  req_body_form?: unknown[];
  req_body_other?: string;
  req_body?: string;
  res_body?: string;
  markdown?: string;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function yapiPath(path: string): string {
  if (path.startsWith(YAPI_API_PREFIX)) return path;
  if (path.startsWith("/api/")) return `${YAPI_API_PREFIX}${path.slice(4)}`;
  return `${YAPI_API_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

async function yapiFetch<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {};
    if (init?.body) headers["Content-Type"] = "application/json";
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (!Array.isArray(init.headers)) {
        Object.assign(headers, init.headers);
      }
    }

    const res = await fetch(yapiPath(path), {
      credentials: "include",
      ...init,
      signal: init?.signal ?? controller.signal,
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as YapiEnvelope<T>;
    if (json.errcode && json.errcode !== 0) {
      if (json.errcode === 40011 || json.errmsg?.includes("登录")) {
        throw new YapiAuthError(json.errmsg || "未登录");
      }
      throw new YapiError(json.errcode, json.errmsg || "YApi error");
    }
    return json.data as T;
  } catch (err) {
    if (err instanceof YapiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new YapiNetworkError();
    }
    if (err instanceof TypeError) {
      throw new YapiNetworkError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function getStatus(): Promise<YapiUser | null> {
  try {
    const data = await yapiFetch<YapiUser>("/api/user/status", undefined, 8_000);
    if (!data || (!data._id && !data.id && !data.email)) return null;
    return data;
  } catch (err) {
    if (err instanceof YapiAuthError) return null;
    throw err;
  }
}

export async function login(email: string, password: string): Promise<YapiUser> {
  const data = await yapiFetch<YapiUser>("/api/user/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!data) throw new YapiError(-1, "登录失败");
  return data;
}

export async function logout(): Promise<void> {
  await yapiFetch<unknown>("/api/user/logout");
}

export interface YapiProjectListData {
  list?: YapiProject[];
}

async function listProjectsByGroup(groupId: number): Promise<YapiProject[]> {
  const data = await yapiFetch<YapiProjectListData | YapiProject[]>(
    `/api/project/list?group_id=${groupId}`,
  );
  if (Array.isArray(data)) return data;
  return data?.list || [];
}

export async function listProjects(): Promise<YapiProject[]> {
  const groups = await yapiFetch<YapiGroup[]>("/api/group/list");
  if (!groups?.length) return [];

  const nested = await Promise.all(
    groups.map(async (g) => {
      try {
        const projects = await listProjectsByGroup(g._id);
        return projects.map((p) => ({
          ...p,
          group_name: p.group_name || g.group_name,
          group_id: p.group_id ?? g._id,
        }));
      } catch {
        return [];
      }
    }),
  );

  const seen = new Set<number>();
  return nested.flat().filter((p) => {
    if (seen.has(p._id)) return false;
    seen.add(p._id);
    return true;
  });
}

export async function listMenu(projectId: number): Promise<YapiMenuCat[]> {
  const data = await yapiFetch<YapiMenuCat[]>(`/api/interface/list_menu?project_id=${projectId}`);
  return data || [];
}

export async function listInterfaces(
  projectId: number,
  page = 1,
  limit = 1000,
): Promise<YapiListItem[]> {
  const data = await yapiFetch<{ list?: YapiListItem[]; count?: number } | YapiListItem[]>(
    `/api/interface/list?project_id=${projectId}&page=${page}&limit=${limit}`,
  );
  if (Array.isArray(data)) return data;
  return data?.list || [];
}

export async function getInterface(id: number): Promise<YapiInterfaceDetail> {
  const data = await yapiFetch<YapiInterfaceDetail>(`/api/interface/get?id=${id}`);
  if (!data) throw new YapiError(-1, "empty data");
  return data;
}

export async function fetchYapiStatus(): Promise<{
  configured: boolean;
  upstream: string;
  reachable: boolean;
  message?: string;
}> {
  const res = await fetch("/api/yapi/status");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{
    configured: boolean;
    upstream: string;
    reachable: boolean;
    message?: string;
  }>;
}
