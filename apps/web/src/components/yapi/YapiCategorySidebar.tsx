import {
  Add01Icon,
  ArrowLeft01Icon,
  Download01Icon,
  Logout01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { YapiCategoryGroup } from "@/components/yapi/YapiCategoryGroup";
import { useCopyYapiIface } from "@/hooks/useCopyYapiIface";
import { searchFieldClasses, shortcutKbdClasses } from "@/lib/interaction";
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
    return items.filter((it) => {
      const catName = cats.find((c) => c.id === it.cat)?.name?.toLowerCase() || "";
      return (
        it.title.toLowerCase().includes(q) ||
        it.path.toLowerCase().includes(q) ||
        it.method.toLowerCase().includes(q) ||
        catName.includes(q) ||
        (it.tag || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  })();
  const filteredIds = new Set(filtered.map((i) => i.id));

  return (
    <div className="flex h-full flex-col border-r bg-[#fcfcfe]">
      <div className="border-border/60 border-b px-4 py-3">
        {renaming ? (
          <input
            className="border-border/60 focus:ring-primary/20 w-full rounded-md border px-2 py-1 text-sm font-semibold outline-none focus:ring-2"
            autoFocus
            aria-label="重命名项目"
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
        <div className="border-border/40 flex flex-wrap gap-1 border-b px-2 py-2">
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
        <label htmlFor="yapi-iface-search" className="sr-only">
          搜索接口
        </label>
        <div className={cn(searchFieldClasses(), "flex items-center gap-2 px-3 py-2")}>
          <Icon icon={Search01Icon} className="text-muted-foreground size-4 shrink-0" />
          <input
            id="yapi-iface-search"
            ref={searchRef}
            placeholder="接口名 / 路径 / 方法 / 分类"
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
            if (query.trim() && catItems.length === 0) return null;
            const isOpen = query.trim() ? true : !!open[c.id];
            return (
              <YapiCategoryGroup
                key={c.id}
                cat={c}
                catItems={catItems}
                isOpen={isOpen}
                activeId={activeId}
                query={query}
                sortable={sortable}
                onToggle={() => setOpen({ ...open, [c.id]: !isOpen })}
                onSelect={onSelect}
                onDeleteCat={onDeleteCat}
                onDeleteItem={onDeleteItem}
                onAddToSubcat={onAddToSubcat}
                onReorderItems={onReorderItems}
                isCopied={isCopied}
                isCopying={isCopying}
                onCopy={(it, cat) => void copyIface(it, cat)}
              />
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
