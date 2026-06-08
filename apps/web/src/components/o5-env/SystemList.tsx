import { Badge } from "@/components/ui/badge";
import { LayoutGroup } from "motion/react";
import type { O5System } from "@/types/o5-env";
import { cn } from "@/lib/utils";

import { o5SectionHeaderHintClasses, o5SectionHeaderMutedClasses } from "./o5-section-header";
import { SidebarNavItem } from "./SidebarNavItem";
import { SortableSidebarNavList } from "./SortableSidebarNavList";

type SystemListProps = {
  systems: O5System[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
};

export function SystemList({ systems, selectedId, onSelect, onReorder }: SystemListProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent">
      <h2 className={cn(o5SectionHeaderMutedClasses, "shrink-0 px-4 pt-3 pb-1.5")}>
        <span className="size-1.5 shrink-0 rounded-full bg-primary/60" />
        <span className="min-w-0 truncate">
          系统列表
          <span className={o5SectionHeaderHintClasses}> · 按住拖动排序</span>
        </span>
      </h2>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <LayoutGroup id="o5-system-nav">
          <SortableSidebarNavList
            items={systems}
            listClassName="flex flex-col gap-0.5 px-2 pb-2"
            onReorder={onReorder}
            renderItem={(system, sortable) => {
              const isSelected = system.id === selectedId;
              return (
                <SidebarNavItem
                  appearance="soft"
                  selected={isSelected}
                  selectionLayoutId="o5-system-nav"
                  sortable={sortable}
                  onClick={() => onSelect(system.id)}
                  trailing={
                    <Badge
                      variant="outline"
                      className={cn(
                        "tabular-nums border-primary/10 bg-white/40 px-1.5 py-0 text-[10px] text-primary/85 font-medium tracking-tight",
                        isSelected &&
                          "border-primary/25 bg-white text-primary font-semibold shadow-2xs",
                      )}
                    >
                      {system.count}
                    </Badge>
                  }
                >
                  {system.name}
                </SidebarNavItem>
              );
            }}
          />
        </LayoutGroup>
      </div>
    </section>
  );
}
