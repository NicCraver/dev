import { useCallback, useEffect, useState } from "react";

import { applyIdOrder, reorderIds } from "@/lib/apply-account-order";
import type { O5Account } from "@/types/o5-env";

const STORAGE_KEY = "o5-env-account-order";

type OrderStore = Record<string, string[]>;

function readStore(): OrderStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as OrderStore;
  } catch {
    return {};
  }
}

export function useO5AccountOrder(systemKey: string | null) {
  const [store, setStore] = useState<OrderStore>(readStore);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const order = systemKey ? (store[systemKey] ?? []) : [];

  const sortAccounts = useCallback(
    (accounts: O5Account[]) => {
      if (!systemKey || order.length === 0) return accounts;
      return applyIdOrder(accounts, order);
    },
    [systemKey, order],
  );

  const reorderAccounts = useCallback(
    (allAccounts: O5Account[], subset: O5Account[], activeId: string, overId: string) => {
      if (!systemKey || subset.length === 0) return;

      const subsetIds = new Set(subset.map((account) => account.id));
      const baseOrder = order.length > 0 ? order : allAccounts.map((account) => account.id);
      const subsetOrder = baseOrder.filter((id) => subsetIds.has(id));
      const reorderedSubset = reorderIds(subsetOrder, activeId, overId);

      let index = 0;
      const nextOrder = baseOrder.map((id) => (subsetIds.has(id) ? reorderedSubset[index++]! : id));

      setStore((prev) => ({ ...prev, [systemKey]: nextOrder }));
    },
    [systemKey, order],
  );

  return { sortAccounts, reorderAccounts };
}
