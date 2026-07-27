import type { Category, IfaceItem } from "@/lib/yapi-types";

const STORAGE_KEY = "mt-dev:yapi:collections:v1";
const FAV_PROJECTS_KEY = "mt-dev:yapi:fav-projects:v1";

export interface SubCategory {
  id: string;
  name: string;
  items: IfaceItem[];
}

export interface StoredCollection {
  id: string;
  name: string;
  icon: string;
  subcats: SubCategory[];
  createdAt: number;
}

function read(): StoredCollection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCollection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: StoredCollection[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("保存收藏分类失败", err);
  }
}

export function loadCollections(): StoredCollection[] {
  return read();
}

export function saveCollections(list: StoredCollection[]): void {
  write(list);
}

export function loadFavProjects(): number[] {
  try {
    const raw = localStorage.getItem(FAV_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFavProjects(ids: number[]): void {
  try {
    localStorage.setItem(FAV_PROJECTS_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn("保存收藏项目失败", err);
  }
}

export function toggleFavProject(id: number): number[] {
  const list = loadFavProjects();
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  saveFavProjects(next);
  return next;
}

export function genCollectionId(): string {
  return `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function genSubcatId(): string {
  return `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function addCollection(id: string, name: string): StoredCollection {
  const list = read();
  const cat: StoredCollection = {
    id,
    name: name.trim() || "未命名分类",
    icon: "Folder",
    subcats: [],
    createdAt: Date.now(),
  };
  list.push(cat);
  write(list);
  return cat;
}

export function removeCollection(id: string): void {
  write(read().filter((c) => c.id !== id));
}

export function renameCollection(id: string, name: string): void {
  const list = read();
  const c = list.find((x) => x.id === id);
  if (!c) return;
  c.name = name.trim() || c.name;
  write(list);
}

export function addSubcat(
  collectionId: string,
  subcatId: string,
  name: string,
  items: IfaceItem[],
): void {
  const list = read();
  const c = list.find((x) => x.id === collectionId);
  if (!c) return;
  c.subcats = [...(c.subcats || []), { id: subcatId, name: name.trim() || "未命名细分", items }];
  write(list);
}

/** 向已有细分分类追加接口；默认覆盖同 id 接口以重新同步 YApi 内容 */
export function addItemsToSubcat(
  collectionId: string,
  subcatId: string,
  items: IfaceItem[],
  options?: { replaceExisting?: boolean },
): { added: IfaceItem[]; updated: IfaceItem[]; skipped: number; skippedTitles: string[] } {
  const replaceExisting = options?.replaceExisting ?? true;
  const list = read();
  const c = list.find((x) => x.id === collectionId);
  if (!c) {
    return {
      added: [],
      updated: [],
      skipped: items.length,
      skippedTitles: items.map((i) => i.title),
    };
  }
  const s = (c.subcats || []).find((x) => x.id === subcatId);
  if (!s) {
    return {
      added: [],
      updated: [],
      skipped: items.length,
      skippedTitles: items.map((i) => i.title),
    };
  }

  const added: IfaceItem[] = [];
  const updated: IfaceItem[] = [];
  const skippedTitles: string[] = [];
  let skipped = 0;

  for (const it of items) {
    const next = { ...it, cat: subcatId };
    const idx = s.items.findIndex((x) => x.id === it.id);
    if (idx >= 0) {
      if (replaceExisting) {
        s.items[idx] = next;
        updated.push(next);
      } else {
        skipped += 1;
        skippedTitles.push(s.items[idx]?.title || it.title || it.id);
      }
      continue;
    }
    s.items.push(next);
    added.push(next);
  }

  if (added.length || updated.length) write(list);
  return { added, updated, skipped, skippedTitles };
}

export function removeSubcat(collectionId: string, subcatId: string): void {
  const list = read();
  const c = list.find((x) => x.id === collectionId);
  if (!c) return;
  c.subcats = (c.subcats || []).filter((s) => s.id !== subcatId);
  write(list);
}

export function removeItemFromSubcat(collectionId: string, subcatId: string, itemId: string): void {
  const list = read();
  const c = list.find((x) => x.id === collectionId);
  if (!c) return;
  const s = (c.subcats || []).find((x) => x.id === subcatId);
  if (!s) return;
  s.items = s.items.filter((it) => it.id !== itemId);
  write(list);
}

/** 在同一细分分类内调整接口顺序 */
export function reorderSubcatItems(
  collectionId: string,
  subcatId: string,
  activeId: string,
  overId: string,
): boolean {
  const list = read();
  const c = list.find((x) => x.id === collectionId);
  if (!c) return false;
  const s = (c.subcats || []).find((x) => x.id === subcatId);
  if (!s) return false;

  const oldIndex = s.items.findIndex((it) => it.id === activeId);
  const newIndex = s.items.findIndex((it) => it.id === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return false;

  const next = [...s.items];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  s.items = next;
  write(list);
  return true;
}

export function flattenCollectionItems(c: StoredCollection): IfaceItem[] {
  return (c.subcats || []).flatMap((s) => s.items);
}

export function collectionSubcatsToCategories(c: StoredCollection): Category[] {
  return (c.subcats || []).map((s) => ({ id: s.id, name: s.name, icon: "Folder", custom: true }));
}

export function allCollectionItems(list: StoredCollection[]): {
  cats: Category[];
  items: IfaceItem[];
} {
  const cats: Category[] = [{ id: "all", name: "全部接口", icon: "Layers" }];
  const seen = new Set<string>();
  const items: IfaceItem[] = [];
  for (const c of list) {
    for (const s of c.subcats || []) {
      for (const it of s.items) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        items.push({ ...it, cat: "all" });
      }
    }
  }
  return { cats, items };
}
