import type { Corp } from "@mt-dev/shared";

import { fetchAuthCodeViaProxy, fetchCorpListViaProxy, loginAppViaProxy } from "@/lib/o5-env-api";

const BASE = "https://env.lif3ng.cn:3443";
const APP_HEADERS = { clientType: "app" } as const;

type LoginResponse = {
  data?: {
    access_token?: string;
    name?: string;
  };
};

type OrgResponse = {
  data?: {
    corpUsers?: Array<{ corpId: string; getCorpName: string }>;
  };
};

type AuthCodeResponse = {
  data?: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`请求失败 (${res.status})`);
  }
  return (await res.json()) as T;
}

async function loginAppDirect(
  username: string,
  password: string,
): Promise<{ access_token: string; name: string }> {
  const search = new URLSearchParams({ username, password });
  const res = await fetch(`${BASE}/testapi/app/login?${search}`, {
    method: "GET",
    headers: APP_HEADERS,
  });
  const json = await parseJson<LoginResponse>(res);
  const token = json.data?.access_token;
  if (!token) {
    throw new Error("登录失败，未获取到 access_token");
  }
  return { access_token: token, name: json.data?.name ?? "" };
}

async function fetchCorpListDirect(accessToken: string): Promise<Corp[]> {
  const res = await fetch(`${BASE}/testapi/contact/v1/orInv/contactV2/get_my_info_organization`, {
    method: "GET",
    headers: {
      ...APP_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = await parseJson<OrgResponse>(res);
  const corpUsers = json.data?.corpUsers ?? [];
  return corpUsers.map(({ corpId, getCorpName }) => ({
    corpId,
    name: getCorpName,
  }));
}

async function fetchAuthCodeDirect(accessToken: string): Promise<string> {
  const res = await fetch(`${BASE}/testapi/oauth/getAuthCode`, {
    method: "GET",
    headers: {
      ...APP_HEADERS,
      authorization: `Bearer ${accessToken}`,
    },
  });
  const json = await parseJson<AuthCodeResponse>(res);
  const code = json.data;
  if (!code) {
    throw new Error("获取授权码失败");
  }
  return code;
}

async function withProxyFallback<T>(direct: () => Promise<T>, proxy: () => Promise<T>): Promise<T> {
  try {
    return await direct();
  } catch (directError) {
    try {
      return await proxy();
    } catch {
      throw directError;
    }
  }
}

export async function loginApp(
  username: string,
  password: string,
): Promise<{ access_token: string; name: string }> {
  return withProxyFallback(
    () => loginAppDirect(username, password),
    () => loginAppViaProxy(username, password),
  );
}

export async function fetchCorpList(accessToken: string): Promise<Corp[]> {
  return withProxyFallback(
    () => fetchCorpListDirect(accessToken),
    () => fetchCorpListViaProxy(accessToken),
  );
}

export async function fetchAuthCode(accessToken: string): Promise<string> {
  return withProxyFallback(
    () => fetchAuthCodeDirect(accessToken),
    () => fetchAuthCodeViaProxy(accessToken),
  );
}
