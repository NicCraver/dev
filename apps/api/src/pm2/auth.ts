import { randomUUID } from "node:crypto";

import type { Context, Next } from "hono";

const UNLOCK_TTL_MS = 24 * 60 * 60 * 1000;
const unlockSessions = new Map<string, number>();

const PUBLIC_PATHS = new Set(["/api/pm2/status", "/api/pm2/unlock"]);

export function isPm2AuthRequired(): boolean {
  return Boolean(process.env.PM2_API_TOKEN?.trim());
}

export function isPagePasswordRequired(): boolean {
  return Boolean(process.env.PM2_PAGE_PASSWORD?.trim());
}

function pruneUnlockSessions(): void {
  const now = Date.now();
  for (const [token, expiresAt] of unlockSessions) {
    if (expiresAt <= now) unlockSessions.delete(token);
  }
}

export function createUnlockSession(): string {
  pruneUnlockSessions();
  const token = randomUUID();
  unlockSessions.set(token, Date.now() + UNLOCK_TTL_MS);
  return token;
}

export function isUnlockSessionValid(token: string | null | undefined): boolean {
  if (!token?.trim()) return false;
  pruneUnlockSessions();
  const expiresAt = unlockSessions.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    unlockSessions.delete(token);
    return false;
  }
  return true;
}

function readBearerToken(c: Context): string | null {
  const header = c.req.header("Authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

export function verifyPagePassword(password: string): boolean {
  const expected = process.env.PM2_PAGE_PASSWORD?.trim();
  if (!expected) return true;
  return password.trim() === expected;
}

export function checkPageAccess(c: Context): boolean {
  if (!isPagePasswordRequired()) return true;
  if (isUnlockSessionValid(c.req.header("X-PM2-Unlock"))) return true;
  const token = process.env.PM2_API_TOKEN?.trim();
  if (token && readBearerToken(c) === token) return true;
  return false;
}

export function checkApiTokenAccess(c: Context): boolean {
  const token = process.env.PM2_API_TOKEN?.trim();
  if (!token) return true;
  return readBearerToken(c) === token;
}

export async function pm2AuthMiddleware(c: Context, next: Next) {
  const path = new URL(c.req.url).pathname;
  if (PUBLIC_PATHS.has(path)) {
    await next();
    return;
  }

  if (!checkPageAccess(c)) {
    return c.json({ message: "需要 PM2 页面密码" }, 401);
  }

  if (!checkApiTokenAccess(c)) {
    return c.json({ message: "未授权，请配置 PM2 API Token" }, 401);
  }

  await next();
}
