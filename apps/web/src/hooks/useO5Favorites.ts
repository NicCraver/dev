import { useCallback, useEffect, useState } from "react";

import { reorderIds } from "@/lib/apply-account-order";

const STORAGE_KEY = "o5-env-favorites";

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function useO5Favorites() {
  const [favorites, setFavorites] = useState<string[]>(readFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = useCallback((accountId: string) => favorites.includes(accountId), [favorites]);

  const toggleFavorite = useCallback((accountId: string) => {
    setFavorites((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId],
    );
  }, []);

  const reorderFavorites = useCallback(
    (activeId: string, overId: string, visibleIds?: string[]) => {
      setFavorites((prev) => {
        const subset = visibleIds ?? prev;
        const subsetSet = new Set(subset);
        const subsetOrder = prev.filter((id) => subsetSet.has(id));
        const reorderedSubset = reorderIds(subsetOrder, activeId, overId);
        let index = 0;
        return prev.map((id) => (subsetSet.has(id) ? reorderedSubset[index++]! : id));
      });
    },
    [],
  );

  return { favorites, isFavorite, toggleFavorite, reorderFavorites };
}
