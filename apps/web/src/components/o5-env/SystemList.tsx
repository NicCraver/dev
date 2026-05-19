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
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <h2 className="text-lunar-dust shrink-0 px-3 py-2 text-xs font-medium tracking-wide uppercase">
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
                      "tabular-nums rounded-full",
                      isSelected &&
                        "border-crystal-white/20 bg-crystal-white/15 text-crystal-white",
                      !isSelected && "border-lunar-dust/40 text-lunar-dust",
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
