import type { O5Account } from "@/mocks/o5-env";

function extractPortFromEnvironmentName(name: string): string | null {
  const match = name.match(/\b(\d{4,5})\b/);
  return match?.[1] ?? null;
}

/** 根据环境名中的端口构造本地登录页 URL */
export function buildAccountPageUrl(account: O5Account, environmentName: string): string {
  const port = extractPortFromEnvironmentName(environmentName) ?? "6173";
  const url = new URL(`http://localhost:${port}/`);
  url.searchParams.set("phone", account.phone);
  return url.toString();
}

export function openAccountPage(account: O5Account, environmentName: string): void {
  window.open(buildAccountPageUrl(account, environmentName), "_blank", "noopener,noreferrer");
}
