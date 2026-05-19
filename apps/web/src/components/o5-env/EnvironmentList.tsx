import { Link2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { O5Environment } from "@/mocks/o5-env";

import { SidebarNavItem } from "./SidebarNavItem";

type EnvironmentListProps = {
  environments: O5Environment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function EnvironmentList({ environments, selectedId, onSelect }: EnvironmentListProps) {
  return (
    <section className="border-border flex h-full min-h-0 flex-col overflow-hidden border-t bg-white">
      <div className="flex shrink-0 items-center justify-between px-3 py-2">
        <h2
          id="o5-env-list-heading"
          className="text-muted-foreground text-xs font-medium tracking-wide"
        >
          环境列表
        </h2>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            title="同步（即将推出）"
            aria-label="同步（即将推出）"
            disabled
          >
            <Link2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            title="添加用户（即将推出）"
            aria-label="添加用户（即将推出）"
            disabled
          >
            <UserPlus className="size-4" />
          </Button>
        </div>
      </div>
      <div
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        aria-labelledby="o5-env-list-heading"
        role="region"
      >
        <ul className="flex flex-col gap-0.5 px-1 pb-2">
          {environments.length === 0 ? (
            <li className="text-muted-foreground px-3 py-4 text-center text-sm">暂无环境</li>
          ) : (
            environments.map((env) => (
              <li key={env.id}>
                <SidebarNavItem
                  selected={env.id === selectedId}
                  onClick={() => onSelect(env.id)}
                  labelClassName="line-clamp-2"
                >
                  {env.name}
                </SidebarNavItem>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
