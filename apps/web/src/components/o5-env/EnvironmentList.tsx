import { Add01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, LayoutGroup, LazyMotion, domAnimation, m } from "motion/react";
import { useCallback, useMemo, useState, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { O5Environment } from "@/types/o5-env";

import { o5SectionHeaderHintClasses, o5SectionHeaderMutedClasses } from "./o5-section-header";
import { AddLinkDialog } from "./AddLinkDialog";
import { EditLinkDialog } from "./EditLinkDialog";
import { SidebarNavItem } from "./SidebarNavItem";
import { SortableSidebarNavList } from "./SortableSidebarNavList";
import type { SidebarNavSortableProps } from "./SidebarNavItem";

type EnvironmentListItemProps = {
  env: O5Environment;
  selected: boolean;
  canWrite: boolean;
  sortable: SidebarNavSortableProps | null;
  onSelect: () => void;
  onEdit: () => void;
};

function EnvironmentListItem({
  env,
  selected,
  canWrite,
  sortable,
  onSelect,
  onEdit,
}: EnvironmentListItemProps) {
  const trailing = useMemo(
    () =>
      canWrite ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          title="编辑环境"
          aria-label={`编辑 ${env.name}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Icon icon={Edit02Icon} className="size-3" />
        </Button>
      ) : undefined,
    [canWrite, env.name, onEdit],
  );

  return (
    <SidebarNavItem
      appearance="soft"
      selected={selected}
      selectionLayoutId="o5-env-nav"
      sortable={sortable}
      onClick={onSelect}
      trailing={trailing}
    >
      {env.name}
    </SidebarNavItem>
  );
}

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
  const [editingEnv, setEditingEnv] = useState<O5Environment | null>(null);

  const canWrite = writable && Boolean(systemKvId);
  const handleEdit = useCallback((env: O5Environment) => {
    setEditingEnv(env);
  }, []);

  return (
    <section className="border-border/50 flex h-full min-h-0 flex-col overflow-hidden border-t bg-transparent">
      <div className="flex min-w-0 shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-1.5">
        <h2 id="o5-env-list-heading" className={cn(o5SectionHeaderMutedClasses, "min-w-0 flex-1")}>
          <span className="size-1.5 shrink-0 rounded-full bg-emerald-500/60" />
          <span className="min-w-0 truncate">
            环境列表
            {environments.length > 0 && (
              <span className={o5SectionHeaderHintClasses}> · 按住拖动排序</span>
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
      <section
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        aria-labelledby="o5-env-list-heading"
      >
        <LazyMotion features={domAnimation} strict>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
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
                      <EnvironmentListItem
                        env={env}
                        selected={env.id === selectedId}
                        canWrite={canWrite}
                        sortable={sortable}
                        onSelect={() => onSelect(env.id)}
                        onEdit={() => handleEdit(env)}
                      />
                    )}
                  />
                </LayoutGroup>
              )}
            </m.div>
          </AnimatePresence>
        </LazyMotion>
      </section>

      {systemKvId && (
        <>
          <AddLinkDialog
            open={addLinkOpen}
            kvId={systemKvId}
            onClose={() => setAddLinkOpen(false)}
            onSuccess={onRefetch}
          />
          <EditLinkDialog
            open={editingEnv !== null}
            kvId={systemKvId}
            environment={editingEnv}
            onClose={() => setEditingEnv(null)}
            onSuccess={onRefetch}
          />
        </>
      )}
    </section>
  );
}
