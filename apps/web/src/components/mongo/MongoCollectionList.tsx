import { useMemo, useState } from "react";

import type { MongoCollectionInfo } from "@mt-dev/shared";
import { Database01Icon, Search01Icon } from "@hugeicons/core-free-icons";

import { MongoEmptyState } from "@/components/mongo/MongoEmptyState";
import { MongoPanelHeader } from "@/components/mongo/MongoPanelHeader";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { isSystemsCollection } from "@/lib/mongo-format";
import { cn } from "@/lib/utils";

type MongoCollectionListProps = {
  collections: MongoCollectionInfo[];
  selected: string | null;
  loading: boolean;
  onSelect: (name: string) => void;
};

export function MongoCollectionList({
  collections,
  selected,
  loading,
  onSelect,
}: MongoCollectionListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((col) => col.name.toLowerCase().includes(q));
  }, [collections, query]);

  if (loading && collections.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MongoPanelHeader title="集合" />
        <div className="space-y-2 p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted/60 h-14 animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && collections.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MongoPanelHeader title="集合" count={0} />
        <MongoEmptyState
          icon={Database01Icon}
          title="暂无集合"
          description="数据库中还没有可浏览的集合"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <MongoPanelHeader title="集合" count={collections.length} />

      <div className="border-border/40 shrink-0 border-b px-3 py-2">
        <label className="relative block">
          <Icon
            icon={Search01Icon}
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="筛选集合…"
            className={cn(
              "border-border/60 bg-background/80 h-8 w-full rounded-md border pr-2.5 pl-8 text-xs",
              "placeholder:text-muted-foreground/60 focus-visible:ring-ring/40 outline-none focus-visible:ring-2",
            )}
          />
        </label>
      </div>

      <ul className="scrollbar-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-y-contain p-2">
        {filtered.length === 0 ? (
          <li className="text-muted-foreground px-2 py-8 text-center text-xs">无匹配集合</li>
        ) : (
          filtered.map((col) => {
            const isSelected = selected === col.name;
            const isSystems = isSystemsCollection(col.name);
            return (
              <li key={col.name}>
                <button
                  type="button"
                  onClick={() => onSelect(col.name)}
                  className={cn(
                    "hover:bg-muted/70 flex w-full flex-col gap-1 rounded-md px-3 py-2.5 text-left transition-colors",
                    "focus-visible:ring-ring/40 outline-none focus-visible:ring-2",
                    isSelected && "bg-primary-subtle text-foreground ring-primary/20 ring-1",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{col.name}</span>
                    {isSystems && (
                      <Badge
                        variant="outline"
                        className="border-primary/20 text-primary h-5 shrink-0 px-1.5 text-[10px] font-medium"
                      >
                        env
                      </Badge>
                    )}
                  </div>
                  {col.count !== undefined && (
                    <span className="text-muted-foreground text-[11px] tabular-nums">
                      {col.count} 条文档
                    </span>
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
