import { getInterface } from "@/lib/yapi-api";
import type { StoredCollection } from "@/lib/yapi-collections";
import { ifaceToMarkdown, sanitizePathSegment, uniqueFileName } from "@/lib/yapi-export-markdown";
import { detailToIface, yapiIdFromIfaceId } from "@/lib/yapi-project-map";
import type { IfaceItem } from "@/lib/yapi-types";

export type ExportScope =
  | { mode: "collection"; collection: StoredCollection }
  | { mode: "all"; collections: StoredCollection[] };

export type ExportProgress = {
  phase: "sync" | "generate" | "zip";
  current: number;
  total: number;
  label: string;
};

type ExportItem = {
  collectionName: string;
  subcatName: string;
  index: number;
  iface: IfaceItem;
};

type ResolvedItem = ExportItem & {
  syncFailed: boolean;
};

const FETCH_CONCURRENCY = 3;

function collectionsFromScope(scope: ExportScope): StoredCollection[] {
  if (scope.mode === "collection") return [scope.collection];
  return scope.collections;
}

function flattenScopeItems(scope: ExportScope): ExportItem[] {
  const items: ExportItem[] = [];
  for (const collection of collectionsFromScope(scope)) {
    const collectionName = collection.name || "未命名分类";
    for (const subcat of collection.subcats || []) {
      const subcatName = subcat.name || "未命名细分";
      subcat.items.forEach((iface, index) => {
        items.push({
          collectionName,
          subcatName,
          index: index + 1,
          iface,
        });
      });
    }
  }
  return items;
}

function isSyncedDetail(iface: IfaceItem): boolean {
  return iface.synced === true;
}

async function mapWithConcurrency<T, R>(
  list: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  onItemDone?: (index: number) => void,
): Promise<R[]> {
  const results: R[] = Array.from({ length: list.length });
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < list.length) {
      const i = nextIndex;
      nextIndex += 1;
      results[i] = await fn(list[i], i);
      onItemDone?.(i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, list.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function resolveIfaceDetail(
  stub: IfaceItem,
  getCachedDetail?: (id: string) => IfaceItem | undefined,
): Promise<{ iface: IfaceItem; syncFailed: boolean }> {
  const cached = getCachedDetail?.(stub.id);
  if (cached && isSyncedDetail(cached)) {
    return { iface: cached, syncFailed: false };
  }
  if (isSyncedDetail(stub)) {
    return { iface: stub, syncFailed: false };
  }

  try {
    const data = await getInterface(yapiIdFromIfaceId(stub.id));
    const full = detailToIface(data, stub.cat);
    return {
      iface: {
        ...full,
        id: stub.id,
        cat: stub.cat,
        custom: stub.custom,
        yapiUrl: stub.yapiUrl ?? full.yapiUrl,
        yapiApi: stub.yapiApi ?? full.yapiApi,
      },
      syncFailed: false,
    };
  } catch {
    return { iface: cached ?? stub, syncFailed: true };
  }
}

async function resolveAllDetails(
  items: ExportItem[],
  getCachedDetail: ((id: string) => IfaceItem | undefined) | undefined,
  onProgress: (p: ExportProgress) => void,
): Promise<ResolvedItem[]> {
  const total = items.length;
  let done = 0;

  const resolved = await mapWithConcurrency(
    items,
    FETCH_CONCURRENCY,
    async (item) => {
      const { iface, syncFailed } = await resolveIfaceDetail(item.iface, getCachedDetail);
      return { ...item, iface, syncFailed };
    },
    () => {
      done += 1;
      onProgress({
        phase: "sync",
        current: done,
        total,
        label: `正在同步详情 ${done}/${total}`,
      });
    },
  );

  return resolved;
}

function buildZipPath(item: ResolvedItem, fileBase: string): string {
  const collection = sanitizePathSegment(item.collectionName);
  const subcat = sanitizePathSegment(item.subcatName);
  const fileName = `${String(item.index).padStart(3, "0")}-${fileBase}.md`;
  return `${collection}/${subcat}/${fileName}`;
}

export function exportZipFilename(scope: ExportScope): string {
  const date = new Date().toISOString().slice(0, 10);
  if (scope.mode === "collection") {
    const name = sanitizePathSegment(scope.collection.name || "collection");
    return `yapi-${name}-${date}.zip`;
  }
  return `yapi-all-${date}.zip`;
}

export async function exportCollectionsToZip(
  scope: ExportScope,
  onProgress: (p: ExportProgress) => void,
  getCachedDetail?: (id: string) => IfaceItem | undefined,
): Promise<Blob> {
  const items = flattenScopeItems(scope);
  if (!items.length) {
    throw new Error("没有可导出的接口");
  }

  onProgress({ phase: "sync", current: 0, total: items.length, label: "准备同步详情…" });
  const resolved = await resolveAllDetails(items, getCachedDetail, onProgress);

  const usedNamesByDir = new Map<string, Set<string>>();
  const files: { path: string; content: string }[] = [];

  resolved.forEach((item, i) => {
    onProgress({
      phase: "generate",
      current: i + 1,
      total: resolved.length,
      label: `正在生成文档 ${i + 1}/${resolved.length}`,
    });

    const dir = `${sanitizePathSegment(item.collectionName)}/${sanitizePathSegment(item.subcatName)}`;
    if (!usedNamesByDir.has(dir)) usedNamesByDir.set(dir, new Set());
    const usedNames = usedNamesByDir.get(dir)!;

    const titleBase = sanitizePathSegment(item.iface.title || "interface");
    const fileBase = uniqueFileName(titleBase, usedNames);
    const zipPath = buildZipPath(item, fileBase);
    const content = ifaceToMarkdown(item.iface, {
      collectionName: item.collectionName,
      subcatName: item.subcatName,
      syncFailed: item.syncFailed,
    });
    files.push({ path: zipPath, content });
  });

  onProgress({ phase: "zip", current: 0, total: 1, label: "正在打包 ZIP…" });
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content);
  }

  onProgress({ phase: "zip", current: 1, total: 1, label: "打包完成" });
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
