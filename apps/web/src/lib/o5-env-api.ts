import type { AddLinkRequest, AddUserRequest, Corp } from "@mt-dev/shared";

type ApiErrorBody = {
  success?: boolean;
  message?: string;
};

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.message ?? `请求失败 (${res.status})`;
  } catch {
    return `请求失败 (${res.status})`;
  }
}

export async function addUserToEnv(body: AddUserRequest): Promise<void> {
  const res = await fetch("/api/user/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}

export async function addLinkToEnv(body: AddLinkRequest): Promise<void> {
  const res = await fetch("/api/link/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}

type LoginProxyBody =
  | { action: "login"; username: string; password: string }
  | { action: "orgs"; accessToken: string }
  | { action: "authCode"; accessToken: string };

async function loginProxy<T>(body: LoginProxyBody): Promise<T> {
  const res = await fetch("/api/o5-env/login-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as T;
}

type LoginResponse = {
  data?: { access_token?: string; name?: string };
};

type OrgResponse = {
  data?: { corpUsers?: Array<{ corpId: string; getCorpName: string }> };
};

type AuthCodeResponse = {
  data?: string;
};

export async function loginAppViaProxy(
  username: string,
  password: string,
): Promise<{ access_token: string; name: string }> {
  const json = await loginProxy<LoginResponse>({ action: "login", username, password });
  const token = json.data?.access_token;
  if (!token) throw new Error("登录失败，未获取到 access_token");
  return { access_token: token, name: json.data?.name ?? "" };
}

export async function fetchCorpListViaProxy(accessToken: string): Promise<Corp[]> {
  const json = await loginProxy<OrgResponse>({ action: "orgs", accessToken });
  const corpUsers = json.data?.corpUsers ?? [];
  return corpUsers.map(({ corpId, getCorpName }) => ({ corpId, name: getCorpName }));
}

export async function fetchAuthCodeViaProxy(accessToken: string): Promise<string> {
  const json = await loginProxy<AuthCodeResponse>({ action: "authCode", accessToken });
  const code = json.data;
  if (!code) throw new Error("获取授权码失败");
  return code;
}
