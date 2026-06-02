const TOKEN_KEY = "pm2-api-token";
const UNLOCK_KEY = "pm2-unlock-token";
const AUTO_SAVE_KEY = "pm2-auto-save";
const REFRESH_MS_KEY = "pm2-refresh-ms";

export function getPm2UnlockToken(): string {
  return sessionStorage.getItem(UNLOCK_KEY) ?? "";
}

export function setPm2UnlockToken(token: string): void {
  if (token) sessionStorage.setItem(UNLOCK_KEY, token);
  else sessionStorage.removeItem(UNLOCK_KEY);
}

export function clearPm2UnlockToken(): void {
  sessionStorage.removeItem(UNLOCK_KEY);
}

export function getPm2Token(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setPm2Token(token: string): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getPm2AutoSave(): boolean {
  return localStorage.getItem(AUTO_SAVE_KEY) === "true";
}

export function setPm2AutoSave(enabled: boolean): void {
  localStorage.setItem(AUTO_SAVE_KEY, enabled ? "true" : "false");
}

export function getPm2RefreshMs(): number {
  const raw = localStorage.getItem(REFRESH_MS_KEY);
  const n = raw ? Number(raw) : 5000;
  return Number.isFinite(n) && n >= 0 ? n : 5000;
}

export function setPm2RefreshMs(ms: number): void {
  localStorage.setItem(REFRESH_MS_KEY, String(ms));
}
