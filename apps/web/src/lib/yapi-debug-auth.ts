export type YapiDebugAuthSession = {
  username: string;
  name: string;
  accessToken: string;
};

const AUTH_KEY = "mt-dev:yapi-debug:auth";

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
