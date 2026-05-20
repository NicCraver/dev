import { Badge } from "@/components/ui/badge";
import type { O5System } from "@/mocks/o5-env";
import { cn } from "@/lib/utils";

import { SidebarNavItem } from "./SidebarNavItem";

type SystemListProps = {
  systems: O5System[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function SystemList({ systems, selectedId, onSelect }: SystemListProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent">
      <h2 className="text-muted-foreground/75 shrink-0 px-4 pt-3 pb-1.5 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
        系统列表
      </h2>
      <ul className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain px-2 pb-2">
        {systems.map((system) => {
          const isSelected = system.id === selectedId;
          return (
            <li key={system.id}>
              <SidebarNavItem
                appearance="soft"
                selected={isSelected}
                onClick={() => onSelect(system.id)}
                labelClassName="truncate"
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
            </li>
          );
        })}
      </ul>
    </section>
  );
}
