export type YapiDebugAuthSession = {
  username: string;
  name: string;
  accessToken: string;
  corpId: string;
  corpName: string;
  /** 与 shortcut 一致，默认 app */
  clientType: string;
};

const AUTH_KEY = "mt-dev:yapi-debug:auth:v2";

export function loadDebugAuth(): YapiDebugAuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as YapiDebugAuthSession;
    if (!parsed?.username || !parsed?.accessToken) return null;
    return {
      username: parsed.username,
      name: parsed.name || "",
      accessToken: parsed.accessToken,
      corpId: parsed.corpId || "",
      corpName: parsed.corpName || "",
      clientType: parsed.clientType || "app",
    };
  } catch {
    return null;
  }
}

export function saveDebugAuth(session: YapiDebugAuthSession): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearDebugAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}
