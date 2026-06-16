import { useMemo, useState } from "react";

import {
  Copy01Icon,
  FileEmpty02Icon,
  FolderOpenIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import { MongoEmptyState } from "@/components/mongo/MongoEmptyState";
import { MongoPanelHeader } from "@/components/mongo/MongoPanelHeader";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatDocId, getDocListLabel, isSystemsCollection } from "@/lib/mongo-format";
import { cn } from "@/lib/utils";

type MongoDocListProps = {
  collection: string | null;
  docs: Record<string, unknown>[];
  selectedId: string | null;
  loading: boolean;
  copyingId: string | null;
  page: number;
  total: number;
  limit: number;
  onSelect: (id: string) => void;
  onCopy?: (doc: Record<string, unknown>, id: string) => void;
  onPageChange: (page: number) => void;
};

function docId(doc: Record<string, unknown>): string {
  return formatDocId(doc._id);
}

function docPreview(doc: Record<string, unknown>): string {
  try {
    const copy = { ...doc };
    delete copy._id;
    const text = JSON.stringify(copy);
    return text.length > 64 ? `${text.slice(0, 64)}…` : text;
  } catch {
    return "";
  }
}

export function MongoDocList({
  collection,
  docs,
  selectedId,
  loading,
  copyingId,
  page,
  total,
  limit,
  onSelect,
  onCopy,
  onPageChange,
}: MongoDocListProps) {
  const [query, setQuery] = useState("");
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const systemsMode = isSystemsCollection(collection);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !collection) return docs;
    return docs.filter((doc) => {
      const label = getDocListLabel(doc, collection).toLowerCase();
      const id = docId(doc).toLowerCase();
      const preview = docPreview(doc).toLowerCase();
      return label.includes(q) || id.includes(q) || preview.includes(q);
    });
  }, [collection, docs, query]);

  if (!collection) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MongoPanelHeader title="文档" />
        <MongoEmptyState
          icon={FolderOpenIcon}
          title="未选择集合"
          description="从左侧选择一个集合以浏览文档"
        />
      </div>
    );
  }

  const panelTitle = systemsMode ? "系统" : "文档";
  const panelHint = systemsMode ? "· 复制图标直接新建副本" : undefined;

  if (loading && docs.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MongoPanelHeader title={panelTitle} hint={panelHint} />
        <div className="space-y-1.5 p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted/60 h-[3.25rem] animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && docs.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MongoPanelHeader title={panelTitle} count={0} hint={panelHint} />
        <MongoEmptyState
          icon={FileEmpty02Icon}
          title="暂无文档"
          description={systemsMode ? "点列表复制图标快速复制系统" : "集合中暂无文档"}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <MongoPanelHeader title={panelTitle} count={total} hint={panelHint} />

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
            placeholder={systemsMode ? "筛选系统…" : "筛选文档…"}
            className={cn(
              "border-border/60 bg-background/80 h-8 w-full rounded-md border pr-2.5 pl-8 text-xs",
              "placeholder:text-muted-foreground/60 focus-visible:ring-ring/40 outline-none focus-visible:ring-2",
            )}
          />
        </label>
      </div>

      <ul
        className="scrollbar-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-y-contain p-2"
        role="listbox"
        aria-label="文档列表"
      >
        {filteredDocs.length === 0 ? (
          <li className="text-muted-foreground px-2 py-8 text-center text-xs">无匹配结果</li>
        ) : (
          filteredDocs.map((doc) => {
            const id = docId(doc);
            const label = getDocListLabel(doc, collection);
            const isSelected = selectedId === id;
            const isCopying = copyingId === id;
            const secondary = systemsMode ? id : docPreview(doc);

            return (
              <li key={id}>
                <div
                  className={cn(
                    "group hover:bg-muted/60 flex min-w-0 items-center gap-1 rounded-md px-2 py-1.5 transition-colors",
                    isSelected && "bg-primary-subtle ring-primary/20 ring-1",
                  )}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onSelect(id)}
                    className={cn(
                      "flex min-w-0 flex-1 flex-col gap-1 py-1 pl-1 text-left",
                      "focus-visible:ring-ring/40 rounded-sm outline-none focus-visible:ring-2",
                    )}
                  >
                    <span className="block truncate text-sm leading-tight font-medium">
                      {label}
                    </span>
                    {secondary && (
                      <span className="text-muted-foreground block truncate font-mono text-[11px] leading-snug">
                        {secondary}
                      </span>
                    )}
                  </button>
                  {onCopy && (
                    <button
                      type="button"
                      aria-label={`复制「${label}」为新系统`}
                      title="复制为新系统"
                      disabled={isCopying}
                      onClick={() => onCopy(doc, id)}
                      className={cn(
                        "text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1.5 transition-colors",
                        "focus-visible:ring-ring/40 outline-none focus-visible:ring-2",
                        isCopying && "opacity-70",
                      )}
                    >
                      <Icon
                        icon={Copy01Icon}
                        className={cn("size-3.5", isCopying && "animate-pulse")}
                        strokeWidth={1.75}
                      />
                    </button>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {totalPages > 1 && (
        <div className="border-border/50 flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
          >
            上一页
          </Button>
          <span className="text-muted-foreground text-[11px] tabular-nums">
            {page}/{totalPages}
            <span className="text-muted-foreground/60 mx-1">·</span>
            {total} 条
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
