import { useEffect, useState } from "react";

function columnsForWidth(width: number): number {
  if (width >= 900) return 3;
  if (width >= 600) return 2;
  return 1;
}

export function useGridColumns(element: HTMLElement | null): number {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    if (!element) return;

    const update = (width: number) => setColumns(columnsForWidth(width));
    update(element.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => {
      update(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return columns;
}
