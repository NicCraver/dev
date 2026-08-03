import type { YapiInterfaceDetail, YapiListItem, YapiMenuCat } from "@/lib/yapi-api";
import { convertYapiData } from "@/lib/yapi-import";
import type { Category, HttpMethod, IfaceItem, IfaceStatus } from "@/lib/yapi-types";

function statusFromYapi(s?: string): IfaceStatus {
  if (s === "done" || s === "undone" || s === "deprecated") return s === "undone" ? "dev" : s;
  return "done";
}

function formatYapiTime(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function ifaceIdFromYapi(id: number | string): string {
  return `yapi-${id}`;
}

export function yapiIdFromIfaceId(id: string): number {
  return Number(String(id).replace(/^yapi-/, ""));
}

export function mapMenuToCategories(menu: YapiMenuCat[]): Category[] {
  return menu.map((cat) => ({
    id: String(cat._id),
    name: cat.name,
    icon: "Folder",
  }));
}

export function stubFromListItem(item: YapiListItem, catId: string): IfaceItem {
  const id = ifaceIdFromYapi(item._id);
  return {
    id,
    cat: catId,
    method: String(item.method || "GET").toUpperCase() as HttpMethod,
    path: item.path || `/yapi/${item._id}`,
    title: item.title || `接口 #${item._id}`,
    status: statusFromYapi(item.status),
    desc: (item.desc || "").replace(/<[^>]+>/g, "").trim() || item.title || "",
    tag: Array.isArray(item.tag) ? item.tag : [],
    updAt: formatYapiTime(item.up_time) || "",
    author: item.username || String(item.uid ?? "YApi"),
    headers: [],
    query: [],
    pathParams: [],
    body: null,
    responses: [
      { code: 200, label: "OK", desc: "成功", body: { code: 0, message: "ok", data: null } },
    ],
    returns: {
      type: "object",
      fields: [
        { name: "code", type: "integer", required: true, desc: "业务状态码", example: "0" },
        { name: "message", type: "string", required: true, desc: "提示信息", example: "ok" },
        { name: "data", type: "object", required: false, desc: "业务数据", example: "{ ... }" },
      ],
    },
    note: "",
    yapiId: item._id,
    synced: false,
  };
}

export function mapMenuToItems(menu: YapiMenuCat[]): IfaceItem[] {
  const items: IfaceItem[] = [];
  for (const cat of menu) {
    const catId = String(cat._id);
    for (const it of cat.list || []) {
      items.push(stubFromListItem({ ...it, catid: Number(cat._id) }, catId));
    }
  }
  return items;
}

export function mapListToItems(list: YapiListItem[]): IfaceItem[] {
  return list.map((it) => stubFromListItem(it, String(it.catid)));
}

export function mergeListIntoMenuItems(menu: YapiMenuCat[], list: YapiListItem[]): IfaceItem[] {
  const fromMenu = mapMenuToItems(menu);
  if (!list.length) return fromMenu;
  const map = new Map(fromMenu.map((i) => [i.id, i]));
  for (const it of list) {
    const id = ifaceIdFromYapi(it._id);
    if (!map.has(id)) {
      map.set(id, stubFromListItem(it, String(it.catid)));
    }
  }
  return Array.from(map.values());
}

export function detailToIface(data: YapiInterfaceDetail, catId: string): IfaceItem {
  return convertYapiData(data as Parameters<typeof convertYapiData>[0], catId, undefined, {
    custom: false,
  });
}

/** 将单项目 menu/list 映射为「项目 · 分类」维度的 cats + items（用于全部接口） */
export function mapProjectToGlobalBrowse(
  projectId: number,
  projectName: string,
  menu: YapiMenuCat[],
  list: YapiListItem[],
): { cats: Category[]; items: IfaceItem[] } {
  const cats: Category[] = mapMenuToCategories(menu).map((c) => ({
    ...c,
    id: `p${projectId}-c${c.id}`,
    name: `${projectName} · ${c.name}`,
  }));
  const items = mergeListIntoMenuItems(menu, list).map((it) => ({
    ...it,
    cat: `p${projectId}-c${it.cat}`,
    projectId,
  }));
  return { cats, items };
}
