import { yapiIdFromIfaceId } from "@/lib/yapi-project-map";
import type { IfaceItem } from "@/lib/yapi-types";

/** 浏览器直接打开 YApi 页面的地址前缀（内网） */
export const YAPI_WEB_ORIGIN = (
  import.meta.env.VITE_YAPI_WEB_ORIGIN ?? "http://192.168.5.46:3100"
).replace(/\/$/, "");

export function buildYapiInterfacePageUrl(projectId: number, interfaceId: number): string {
  return `${YAPI_WEB_ORIGIN}/project/${projectId}/interface/api/${interfaceId}`;
}

function parseProjectIdFromYapiUrl(url: string): number | null {
  const match = url.match(/\/project\/(\d+)\/interface\/api\/\d+/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isNaN(id) ? null : id;
}

export function resolveYapiInterfacePageUrl(
  iface: IfaceItem,
  projectId?: number | null,
): string | null {
  const interfaceId = iface.yapiId ?? yapiIdFromIfaceId(iface.id);
  if (!interfaceId || Number.isNaN(interfaceId)) return null;

  const projectFromUrl = iface.yapiUrl ? parseProjectIdFromYapiUrl(iface.yapiUrl) : null;
  const resolvedProjectId = projectFromUrl ?? projectId ?? null;
  if (!resolvedProjectId || Number.isNaN(resolvedProjectId)) return null;

  return buildYapiInterfacePageUrl(resolvedProjectId, interfaceId);
}
