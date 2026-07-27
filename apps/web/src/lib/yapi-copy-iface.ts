import { getInterface } from "@/lib/yapi-api";
import { ifaceToMarkdown } from "@/lib/yapi-export-markdown";
import { detailToIface, yapiIdFromIfaceId } from "@/lib/yapi-project-map";
import type { Category, IfaceItem } from "@/lib/yapi-types";

async function copyText(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 非安全上下文或权限被拒，走下方回退
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }

  return ok;
}

export async function resolveIfaceForCopy(
  iface: IfaceItem,
  getCachedDetail?: (id: string) => IfaceItem | undefined,
): Promise<{ iface: IfaceItem; partial: boolean }> {
  const cached = getCachedDetail?.(iface.id);
  if (cached?.synced) return { iface: cached, partial: false };
  if (iface.synced) return { iface, partial: false };

  try {
    const data = await getInterface(yapiIdFromIfaceId(iface.id));
    const full = detailToIface(data, iface.cat);
    return { iface: full, partial: false };
  } catch {
    return { iface: cached ?? iface, partial: true };
  }
}

export function formatIfaceCopyText(
  iface: IfaceItem,
  cat?: Category | null,
  partial = false,
): string {
  const body = ifaceToMarkdown(iface, { subcatName: cat?.name });
  if (!partial) return body;
  return `> 警告：详情未完全同步，以下内容可能不完整\n\n${body}`;
}

export async function copyIfaceDetails(
  iface: IfaceItem,
  cat?: Category | null,
  getCachedDetail?: (id: string) => IfaceItem | undefined,
): Promise<boolean> {
  const { iface: full, partial } = await resolveIfaceForCopy(iface, getCachedDetail);
  const text = formatIfaceCopyText(full, cat, partial);
  return copyText(text);
}
