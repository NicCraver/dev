import {
  Add01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  Download01Icon,
  DragDropVerticalIcon,
  Folder01Icon,
  Logout01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { YapiMethodBadge } from "@/components/yapi/YapiMethodBadge";
import { YapiSortableIfaceList } from "@/components/yapi/YapiSortableIfaceList";
import { useCopyYapiIface } from "@/hooks/useCopyYapiIface";
import { navItemClasses, searchFieldClasses, shortcutKbdClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";
import type { Category, IfaceItem } from "@/lib/yapi-types";

type YapiCategorySidebarProps = {
  cats: Category[];
  items: IfaceItem[];
  activeId: string;
  query: string;
  setQuery: (v: string) => void;
  open: Record<string, boolean>;
  setOpen: (v: Record<string, boolean>) => void;
  onSelect: (id: string) => void;
  projectTitle?: string;
  onRenameProject?: (name: string) => void;
  onBack?: () => void;
  onLogout?: () => void;
  showImport?: boolean;
  onOpenImport?: () => void;
  showExport?: boolean;
  onOpenExport?: () => void;
  addLabel?: string;
  onDeleteCat?: (catId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onAddToSubcat?: (subcatId: string, subcatName: string) => void;
  loading?: boolean;
  sortable?: boolean;
  onReorderItems?: (subcatId: string, activeId: string, overId: string) => void;
  getCachedDetail?: (id: string) => IfaceItem | undefined;
};

export function YapiCategorySidebar({
  cats,
  items,
  activeId,
  query,
  setQuery,
  open,
  setOpen,
  onSelect,
  projectTitle,
  onRenameProject,
  onBack,
  onLogout,
  showImport = true,
  onOpenImport,
  showExport = false,
  onOpenExport,
  addLabel = "自定义分类",
  onDeleteCat,
  onDeleteItem,
  onAddToSubcat,
  loading = false,
  sortable = false,
  onReorderItems,
  getCachedDetail,
}: YapiCategorySidebarProps) {
  const { copyIface, isCopied, isCopying } = useCopyYapiIface(getCachedDetail);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(projectTitle || "");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.path.toLowerCase().includes(q) ||
        (it.tag || []).some((t) => t.toLowerCase().includes(q)),
    );
  })();
  const filteredIds = new Set(filtered.map((i) => i.id));

  return (
    <div className="flex h-full flex-col border-r bg-[#fcfcfe]">
      <div className="border-border/60 border-b px-4 py-3">
        {renaming ? (
          <input
            className="border-border/60 w-full rounded-md border px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => {
              setRenaming(false);
              const v = draftName.trim();
              if (v && v !== projectTitle) onRenameProject?.(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              } else if (e.key === "Escape") {
                setDraftName(projectTitle || "");
                setRenaming(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className={cn(
              "text-left text-sm font-semibold text-slate-800",
              onRenameProject && "hover:text-primary cursor-text",
            )}
            onClick={
              onRenameProject
                ? () => {
                    setDraftName(projectTitle || "");
                    setRenaming(true);
                  }
                : undefined
            }
          >
            {projectTitle || "YApi Docs"}
          </button>
        )}
        <p className="text-muted-foreground mt-0.5 text-xs">
          {projectTitle ? "接口文档浏览" : "自定义接口文档"}
        </p>
      </div>

      {(onBack || onLogout) && (
        <div className="flex flex-wrap gap-1 border-b border-border/40 px-2 py-2">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onBack}
            >
              <Icon icon={ArrowLeft01Icon} className="size-3.5" />
              项目列表
            </Button>
          ) : null}
          {onLogout ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 text-xs"
              onClick={onLogout}
            >
              <Icon icon={Logout01Icon} className="size-3.5" />
              退出
            </Button>
          ) : null}
        </div>
      )}

      <div className="px-3 py-2">
        <div className={cn(searchFieldClasses(), "flex items-center gap-2 px-3 py-2")}>
          <Icon icon={Search01Icon} className="text-muted-foreground size-4 shrink-0" />
          <input
            ref={searchRef}
            placeholder="搜索接口名 / 路径 / 标签"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <span className={shortcutKbdClasses}>⌘K</span>
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="text-muted-foreground p-4 text-sm">加载中…</div>
        ) : (
          cats.map((c) => {
            const catItems = items.filter((i) => i.cat === c.id && filteredIds.has(i.id));
            const isOpen = query.trim() ? true : !!open[c.id];
            const canDeleteCat = !!c.custom;
            return (
              <div key={c.id} className="mb-1">
                <button
                  type="button"
                  className="hover:bg-muted/60 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-slate-700"
                  onClick={() => setOpen({ ...open, [c.id]: !isOpen })}
                >
                  <Icon icon={Folder01Icon} className="text-muted-foreground size-3.5" />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {canDeleteCat ? (
                    <Badge variant="outline" className="text-[9px]">
                      自定义
                    </Badge>
                  ) : null}
                  <span className="text-muted-foreground tabular-nums">{catItems.length}</span>
                  {canDeleteCat && onAddToSubcat ? (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-primary rounded p-0.5"
                      title="添加接口"
                      aria-label={`向「${c.name}」添加接口`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToSubcat(c.id, c.name);
                      }}
                    >
                      <Icon icon={Add01Icon} className="size-3" />
                    </button>
                  ) : null}
                  {canDeleteCat && onDeleteCat ? (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive rounded p-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCat(c.id);
                      }}
                    >
                      <Icon icon={Delete02Icon} className="size-3" />
                    </button>
                  ) : null}
                </button>
                {isOpen ? (
                  <div className="mt-0.5 space-y-0.5 pl-1">
                    <YapiSortableIfaceList
                      items={catItems}
                      enabled={sortable && canDeleteCat && !query.trim() && !!onReorderItems}
                      onReorder={(activeId, overId) => onReorderItems?.(c.id, activeId, overId)}
                      overlayClassName="rounded-lg bg-white shadow-md ring-2 ring-primary/20"
                      renderItem={(it, { dragHandle, isDragging }) => {
                        const isActive = it.id === activeId;
                        const canDeleteItem = !!(it.custom || c.custom);
                        const docCopied = isCopied(it.id);
                        const docCopying = isCopying(it.id);
                        return (
                          <div
                            className={cn(
                              "flex items-start gap-0.5 rounded-lg",
                              isDragging && "shadow-sm",
                            )}
                          >
                            {dragHandle ? (
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground mt-2.5 shrink-0 cursor-grab touch-none rounded p-1 active:cursor-grabbing"
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
                                "flex min-w-0 flex-1 flex-col gap-1 rounded-lg px-2.5 py-2 text-left",
                                navItemClasses({ selected: isActive }),
                              )}
                              onClick={() => onSelect(it.id)}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <YapiMethodBadge method={it.method} className="text-[11px]" />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                                  {it.title}
                                </span>
                              </div>
                              <code className="text-muted-foreground block truncate font-mono text-xs">
                                {it.path}
                              </code>
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-foreground mt-1 size-8 shrink-0"
                              disabled={docCopying}
                              aria-label={docCopied ? "已复制接口文档" : "复制接口文档"}
                              title={docCopied ? "已复制" : "复制接口文档"}
                              onClick={(e) => {
                                e.stopPropagation();
                                void copyIface(it, c);
                              }}
                            >
                              <Icon
                                icon={docCopied ? CheckmarkCircle02Icon : Copy01Icon}
                                className="size-4"
                              />
                            </Button>
                            {canDeleteItem && onDeleteItem ? (
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-destructive mt-1 shrink-0 rounded p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteItem(it.id);
                                }}
                              >
                                <Icon icon={Delete02Icon} className="size-3.5" />
                              </button>
                            ) : null}
                          </div>
                        );
                      }}
                    />
                    {catItems.length === 0 ? (
                      <div className="text-muted-foreground px-3 py-1 text-xs">无匹配</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {(showExport && onOpenExport) || (showImport && onOpenImport) ? (
        <div className="border-border/60 space-y-2 border-t p-3">
          {showExport && onOpenExport ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onOpenExport}
            >
              <Icon icon={Download01Icon} className="size-3.5" />
              导出文档
            </Button>
          ) : null}
          {showImport && onOpenImport ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onOpenImport}
            >
              <Icon icon={Add01Icon} className="size-3.5" />
              {addLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
