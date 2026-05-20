import { useCallback, useEffect, useState } from "react";

import { applyIdOrder, reorderIds } from "@/lib/apply-account-order";
import type { O5System } from "@/types/o5-env";

const STORAGE_KEY = "o5-env-system-order";

function readOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function useO5SystemOrder() {
  const [order, setOrder] = useState<string[]>(readOrder);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  }, [order]);

  const sortSystems = useCallback((systems: O5System[]) => applyIdOrder(systems, order), [order]);

  const reorderSystems = useCallback(
    (systems: O5System[], activeId: string, overId: string) => {
      const baseOrder = order.length > 0 ? order : systems.map((system) => system.id);
      setOrder(reorderIds(baseOrder, activeId, overId));
    },
    [order],
  );

  return { sortSystems, reorderSystems };
}
