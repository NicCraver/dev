import type { O5Account } from "@/types/o5-env";

/** 按已保存的 id 顺序排列，未出现在 order 中的项追加在末尾。 */
export function applyIdOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  if (order.length === 0) return items;

  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered: T[] = [];

  for (const id of order) {
    const item = byId.get(id);
    if (item) {
      ordered.push(item);
      byId.delete(id);
    }
  }

  for (const item of items) {
    if (byId.has(item.id)) ordered.push(item);
  }

  return ordered;
}

/** 按已保存的 id 顺序排列账号，未出现在 order 中的账号追加在末尾。 */
export function applyAccountOrder(accounts: O5Account[], order: string[]): O5Account[] {
  return applyIdOrder(accounts, order);
}

export function reorderIds(ids: string[], activeId: string, overId: string): string[] {
  const oldIndex = ids.indexOf(activeId);
  const newIndex = ids.indexOf(overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return ids;

  const next = [...ids];
  next.splice(oldIndex, 1);
  next.splice(newIndex, 0, activeId);
  return next;
}
