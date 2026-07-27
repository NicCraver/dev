import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { YapiMethodBadge } from "@/components/yapi/YapiMethodBadge";
import { YapiSortableIfaceList } from "@/components/yapi/YapiSortableIfaceList";
import { useCopyYapiIface } from "@/hooks/useCopyYapiIface";
import { segmentButtonClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";
import type { Category, IfaceItem, IfaceStatus } from "@/lib/yapi-types";
import { STATUS_LABEL } from "@/lib/yapi-types";

const METHODS = ["ALL", "GET", "POST", "PUT", "DELETE"] as const;

const STATUS_STYLES: Record<IfaceStatus, string> = {
  done: "text-emerald-600",
  dev: "text-amber-600",
  deprecated: "text-slate-500",
};

type YapiInterfaceListProps = {
  cat: Category | null;
  items: IfaceItem[];
  activeId: string;
  onSelect: (id: string) => void;
  methodFilter: string;
  setMethodFilter: (m: string) => void;
  onDeleteItem?: (id: string) => void;
  loading?: boolean;
  sortable?: boolean;
  onReorderItems?: (subcatId: string, activeId: string, overId: string) => void;
  getCachedDetail?: (id: string) => IfaceItem | undefined;
};

export function YapiInterfaceList({
  cat,
  items,
  activeId,
  onSelect,
  methodFilter,
  setMethodFilter,
  onDeleteItem,
  loading = false,
  sortable = false,
  onReorderItems,
  getCachedDetail,
}: YapiInterfaceListProps) {
  const { copyIface, isCopied, isCopying } = useCopyYapiIface(getCachedDetail);
  const list = cat ? items.filter((i) => i.cat === cat.id) : items;
  const shown = methodFilter === "ALL" ? list : list.filter((i) => i.method === methodFilter);
  const canSort = sortable && !!cat?.custom && methodFilter === "ALL" && !!onReorderItems && !!cat;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-border/60 border-b px-4 py-3">
        <div className="text-sm font-semibold text-slate-800">
          {loading ? "加载中…" : (cat?.name ?? "全部接口")}
        </div>
        <div className="text-muted-foreground mt-0.5 text-xs">
          {loading ? "—" : `${shown.length} 个接口`}
          {canSort ? " · 拖拽左侧把手排序" : ""}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-semibold",
                segmentButtonClasses(methodFilter === m),
              )}
              onClick={() => setMethodFilter(m)}
            >
              {m === "ALL" ? "全部" : m}
            </button>
          ))}
        </div>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-muted-foreground p-4 text-sm">加载接口列表…</div>
        ) : (
          <YapiSortableIfaceList
            items={shown}
            enabled={canSort}
            onReorder={(activeId, overId) => onReorderItems!(cat!.id, activeId, overId)}
            overlayClassName="rounded-xl border border-primary/30 bg-white shadow-md"
            renderItem={(it, { dragHandle, isDragging }) => {
              const canDelete = !!(it.custom || cat?.custom);
              const isActive = it.id === activeId;
              const docCopied = isCopied(it.id);
              const docCopying = isCopying(it.id);
              return (
                <div className={cn("mb-1.5 flex gap-1", isDragging && "opacity-90")}>
                  {dragHandle ? (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground mt-3 shrink-0 cursor-grab touch-none self-start rounded p-1 active:cursor-grabbing"
                      aria-label="拖拽排序"
                      {...dragHandle.attributes}
                      {...dragHandle.listeners}
                    >
                      <Icon icon={DragDropVerticalIcon} className="size-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={cn(
                      "min-w-0 flex-1 rounded-xl border p-3 text-left transition-colors",
                      isActive
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 hover:border-primary/20 hover:bg-muted/30",
                    )}
                    onClick={() => onSelect(it.id)}
                  >
                    <div className="flex items-center gap-2">
                      <YapiMethodBadge method={it.method} />
                      <code className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-[11px]">
                        {it.path}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground size-7 shrink-0"
                        disabled={docCopying}
                        aria-label={docCopied ? "已复制接口文档" : "复制接口文档"}
                        title={docCopied ? "已复制" : "复制接口文档"}
                        onClick={(e) => {
                          e.stopPropagation();
                          void copyIface(it, cat);
                        }}
                      >
                        <Icon
                          icon={docCopied ? CheckmarkCircle02Icon : Copy01Icon}
                          className="size-3.5"
                        />
                      </Button>
                      {canDelete && onDeleteItem ? (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(it.id);
                          }}
                        >
                          <Icon icon={Delete02Icon} className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-800">{it.title}</div>
                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[10px]">
                      <span className={STATUS_STYLES[it.status]}>{STATUS_LABEL[it.status]}</span>
                      <span>{it.updAt}</span>
                      <span>·</span>
                      <span>{it.author}</span>
                    </div>
                  </button>
                </div>
              );
            }}
          />
        )}
        {!loading && shown.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center text-sm">该筛选下无接口。</div>
        ) : null}
      </div>
    </div>
  );
}
