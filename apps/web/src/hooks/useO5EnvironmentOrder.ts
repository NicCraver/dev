import { useCallback, useEffect, useState } from "react";

import { applyIdOrder, reorderIds } from "@/lib/apply-account-order";
import type { O5Environment } from "@/types/o5-env";

const STORAGE_KEY = "o5-env-environment-order";

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

export function useO5EnvironmentOrder(systemId: string | null) {
  const [store, setStore] = useState<OrderStore>(readStore);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const order = systemId ? (store[systemId] ?? []) : [];

  const sortEnvironments = useCallback(
    (environments: O5Environment[]) => {
      if (!systemId || order.length === 0) return environments;
      return applyIdOrder(environments, order);
    },
    [systemId, order],
  );

  const reorderEnvironments = useCallback(
    (environments: O5Environment[], activeId: string, overId: string) => {
      if (!systemId || environments.length === 0) return;
      const baseOrder = order.length > 0 ? order : environments.map((env) => env.id);
      setStore((prev) => ({
        ...prev,
        [systemId]: reorderIds(baseOrder, activeId, overId),
      }));
    },
    [systemId, order],
  );

  return { sortEnvironments, reorderEnvironments };
}
