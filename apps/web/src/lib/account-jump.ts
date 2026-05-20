import type { AccountJumpRequest } from "@mt-dev/shared";

import { fetchAuthCode, loginApp } from "@/lib/external-login";

export function buildJumpUrl(targetUrl: string, userCode: string, corpId: string): string {
  const { origin, pathname, search } = new URL(targetUrl);
  const params = new URLSearchParams(search);
  params.set("userCode", userCode);
  params.set("corpId", corpId);
  return `${origin}${pathname}?${params}`;
}

export function resolveWindowName(
  ctrlKey: boolean,
  corpId: string,
  username: string,
  targetUrl: string,
): string {
  if (ctrlKey) {
    return `page-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return `page-${corpId}-${username}-${targetUrl.replace(/[:/]/g, "_")}`;
}

export async function openAccountJump(payload: AccountJumpRequest): Promise<void> {
  if (!payload.targetUrl?.trim()) {
    alert("请先选择一个环境");
    return;
  }

  try {
    const token = await loginApp(payload.username, payload.password);
    const code = await fetchAuthCode(token.access_token);
    const url = buildJumpUrl(payload.targetUrl, code, payload.corpId);
    const windowName = resolveWindowName(
      !!payload.ctrlKey,
      payload.corpId,
      payload.username,
      payload.targetUrl,
    );
    window.open(url, windowName, payload.features ?? "noopener,noreferrer");
  } catch (error) {
    console.error("跳转失败:", error);
    alert("跳转失败，请重试");
  }
}
