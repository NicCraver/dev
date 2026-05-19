import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "o5-env-grid-layout";

export type O5GridLayout = "auto" | "1" | "2" | "3";

const VALID_LAYOUTS: O5GridLayout[] = ["auto", "1", "2", "3"];

function readLayout(): O5GridLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_LAYOUTS.includes(raw as O5GridLayout)) {
      return raw as O5GridLayout;
    }
  } catch {
    // ignore
  }
  return "auto";
}

export function useO5GridLayout() {
  const [layout, setLayoutState] = useState<O5GridLayout>(readLayout);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, layout);
  }, [layout]);

  const setLayout = useCallback((next: O5GridLayout) => {
    setLayoutState(next);
  }, []);

  return { layout, setLayout };
}

export function resolveGridColumns(layout: O5GridLayout, autoColumns: number): number {
  if (layout === "auto") return autoColumns;
  return Number(layout);
}
