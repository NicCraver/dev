import { WrenchIcon } from "@hugeicons/core-free-icons";

import type { ToolDefinition } from "@/app/tools/registry";
import { SidebarNavItem } from "@/components/o5-env/SidebarNavItem";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ToolListProps = {
  tools: ToolDefinition[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function ToolList({ tools, activeId, onSelect }: ToolListProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="border-border/60 shrink-0 border-b px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Icon icon={WrenchIcon} className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">开发者工具</p>
            <p className="text-muted-foreground text-[11px] font-medium">
              {tools.length} 个实用工具
            </p>
          </div>
        </div>
      </header>

      <h2 className="text-muted-foreground/75 flex shrink-0 items-center gap-1.5 px-4 pt-3 pb-1.5 text-[10px] font-bold tracking-widest uppercase">
        <span className="bg-primary/60 h-1.5 w-1.5 rounded-full" />
        工具目录
      </h2>
      <ul className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain px-2 pb-2">
        {tools.map((tool) => {
          const selected = tool.id === activeId;
          return (
            <li key={tool.id}>
              <SidebarNavItem
                appearance="soft"
                selected={selected}
                onClick={() => onSelect(tool.id)}
                labelClassName="truncate"
              >
                <span className="flex items-center gap-2">
                  <Icon
                    icon={tool.icon}
                    className={cn(
                      "size-4 shrink-0",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                    strokeWidth={1.75}
                  />
                  {tool.label}
                </span>
              </SidebarNavItem>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
