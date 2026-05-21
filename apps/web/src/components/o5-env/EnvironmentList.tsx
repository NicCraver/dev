import { Add01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { O5Environment } from "@/types/o5-env";

import { AddLinkDialog } from "./AddLinkDialog";
import { SidebarNavItem } from "./SidebarNavItem";
import { SortableSidebarNavList } from "./SortableSidebarNavList";

type EnvironmentListProps = {
  environments: O5Environment[];
  selectedId: string | null;
  systemKvId: string | null;
  writable?: boolean;
  onSelect: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onRefetch: () => void;
};

export function EnvironmentList({
  environments,
  selectedId,
  systemKvId,
  writable = false,
  onSelect,
  onReorder,
  onRefetch,
}: EnvironmentListProps) {
  const [addLinkOpen, setAddLinkOpen] = useState(false);

  const canWrite = writable && Boolean(systemKvId);

  return (
    <section className="border-border/50 flex h-full min-h-0 flex-col overflow-hidden border-t bg-transparent">
      <div className="flex min-w-0 shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-1.5">
        <h2
          id="o5-env-list-heading"
          className="text-muted-foreground/75 flex min-w-0 flex-1 items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/60" />
          <span className="min-w-0 truncate">
            环境列表
            {environments.length > 0 && (
              <span className="font-normal normal-case tracking-normal text-slate-400/80">
                {" "}
                · 按住拖动排序
              </span>
            )}
          </span>
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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={systemKvId ?? "__none__"}
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {environments.length === 0 ? (
              <p className="text-muted-foreground/55 px-4 py-8 text-center text-xs italic">
                暂无环境
              </p>
            ) : (
              <LayoutGroup id="o5-env-nav">
                <SortableSidebarNavList
                  items={environments}
                  listClassName="flex flex-col gap-0.5 px-2 pb-2"
                  onReorder={onReorder}
                  renderItem={(env, sortable) => (
                    <SidebarNavItem
                      appearance="soft"
                      selected={env.id === selectedId}
                      selectionLayoutId="o5-env-nav"
                      sortable={sortable}
                      onClick={() => onSelect(env.id)}
                    >
                      {env.name}
                    </SidebarNavItem>
                  )}
                />
              </LayoutGroup>
            )}
          </motion.div>
        </AnimatePresence>
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
