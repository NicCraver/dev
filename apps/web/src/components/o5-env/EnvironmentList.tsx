import { Add01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { O5Environment } from "@/types/o5-env";

import { AddLinkDialog } from "./AddLinkDialog";
import { SidebarNavItem } from "./SidebarNavItem";

type EnvironmentListProps = {
  environments: O5Environment[];
  selectedId: string | null;
  systemKvId: string | null;
  writable?: boolean;
  onSelect: (id: string) => void;
  onRefetch: () => void;
};

export function EnvironmentList({
  environments,
  selectedId,
  systemKvId,
  writable = false,
  onSelect,
  onRefetch,
}: EnvironmentListProps) {
  const [addLinkOpen, setAddLinkOpen] = useState(false);

  const canWrite = writable && Boolean(systemKvId);

  return (
    <section className="border-border/50 flex h-full min-h-0 flex-col overflow-hidden border-t bg-transparent">
      <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-1.5">
        <h2
          id="o5-env-list-heading"
          className="text-muted-foreground/75 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
          环境列表
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-8", !canWrite && "opacity-40")}
          title={canWrite ? "添加环境链接" : "需连接 MongoDB 且选中系统"}
          aria-label="添加环境链接"
          disabled={!canWrite}
          onClick={() => setAddLinkOpen(true)}
        >
          <Icon icon={Add01Icon} className="size-4" />
        </Button>
      </div>
      <div
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        aria-labelledby="o5-env-list-heading"
        role="region"
      >
        <ul className="flex flex-col gap-0.5 px-2 pb-2">
          {environments.length === 0 ? (
            <li className="text-muted-foreground/55 px-4 py-8 text-center text-xs italic">
              暂无环境
            </li>
          ) : (
            environments.map((env) => (
              <li key={env.id}>
                <SidebarNavItem
                  appearance="soft"
                  selected={env.id === selectedId}
                  onClick={() => onSelect(env.id)}
                  labelClassName="line-clamp-2 text-slate-700"
                >
                  {env.name}
                </SidebarNavItem>
              </li>
            ))
          )}
        </ul>
      </div>

      {systemKvId && (
        <AddLinkDialog
          open={addLinkOpen}
          kvId={systemKvId}
          onClose={() => setAddLinkOpen(false)}
          onSuccess={onRefetch}
        />
      )}
    </section>
  );
}
