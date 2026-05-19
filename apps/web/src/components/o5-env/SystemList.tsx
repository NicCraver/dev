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
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <h2 className="text-muted-foreground shrink-0 px-3 py-2 text-xs font-medium tracking-wide">
        系统列表
      </h2>
      <ul className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain px-1 pb-2">
        {systems.map((system) => {
          const isSelected = system.id === selectedId;
          return (
            <li key={system.id}>
              <SidebarNavItem
                selected={isSelected}
                onClick={() => onSelect(system.id)}
                labelClassName="truncate"
                trailing={
                  <Badge
                    variant={isSelected ? "secondary" : "outline"}
                    className={cn(
                      "tabular-nums",
                      isSelected &&
                        "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground",
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
