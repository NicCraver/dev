import {
  Add01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { YapiMethodBadge } from "@/components/yapi/YapiMethodBadge";
import { YapiSortableIfaceList } from "@/components/yapi/YapiSortableIfaceList";
import { navItemClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";
import type { Category, IfaceItem } from "@/lib/yapi-types";

type YapiCategoryGroupProps = {
  cat: Category;
  catItems: IfaceItem[];
  isOpen: boolean;
  activeId: string;
  query: string;
  sortable: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onDeleteCat?: (catId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onAddToSubcat?: (subcatId: string, subcatName: string) => void;
  onReorderItems?: (subcatId: string, activeId: string, overId: string) => void;
  isCopied: (id: string) => boolean;
  isCopying: (id: string) => boolean;
  onCopy: (it: IfaceItem, cat: Category) => void;
};

export function YapiCategoryGroup({
  cat: c,
  catItems,
  isOpen,
  activeId,
  query,
  sortable,
  onToggle,
  onSelect,
  onDeleteCat,
  onDeleteItem,
  onAddToSubcat,
  onReorderItems,
  isCopied,
  isCopying,
  onCopy,
}: YapiCategoryGroupProps) {
  const canDeleteCat = !!c.custom;

  return (
    <div className="mb-1">
      <div className="hover:bg-muted/60 flex w-full items-center gap-1 rounded-lg px-1 py-0.5 text-xs font-medium text-slate-700">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left"
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "折叠" : "展开"}分类 ${c.name}`}
          onClick={onToggle}
        >
          <Icon icon={Folder01Icon} className="text-muted-foreground size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{c.name}</span>
          {canDeleteCat ? (
            <Badge variant="outline" className="text-[9px]">
              自定义
            </Badge>
          ) : null}
          <span className="text-muted-foreground tabular-nums">{catItems.length}</span>
        </button>
        {canDeleteCat && onAddToSubcat ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-primary rounded p-0.5"
            title="添加接口"
            aria-label={`向「${c.name}」添加接口`}
            onClick={() => onAddToSubcat(c.id, c.name)}
          >
            <Icon icon={Add01Icon} className="size-3" />
          </button>
        ) : null}
        {canDeleteCat && onDeleteCat ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive rounded p-0.5"
            aria-label={`删除分类 ${c.name}`}
            onClick={() => onDeleteCat(c.id)}
          >
            <Icon icon={Delete02Icon} className="size-3" />
          </button>
        ) : null}
      </div>
      {isOpen ? (
        <div className="mt-0.5 space-y-0.5 pl-1">
          <YapiSortableIfaceList
            items={catItems}
            enabled={sortable && canDeleteCat && !query.trim() && !!onReorderItems}
            onReorder={(dragActiveId, overId) => onReorderItems?.(c.id, dragActiveId, overId)}
            overlayClassName="ring-primary/20 rounded-lg bg-white shadow-md ring-2"
            renderItem={(it, { dragHandle, isDragging }) => {
              const isActive = it.id === activeId;
              const canDeleteItem = !!(it.custom || c.custom);
              const docCopied = isCopied(it.id);
              const docCopying = isCopying(it.id);
              return (
                <div
                  className={cn("flex items-start gap-0.5 rounded-lg", isDragging && "shadow-sm")}
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
                      onCopy(it, c);
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
                      aria-label={`删除接口 ${it.title}`}
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
}
