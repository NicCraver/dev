import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { O5Account } from "@/types/o5-env";

import { useAccountPanelSortable } from "./AccountPanelSortable";
import { o5SectionHeaderHintClasses, o5SectionHeaderMutedClasses } from "./o5-section-header";

type SortableAccountGridProps = {
  accounts: O5Account[];
  columns: number;
  renderCard: (account: O5Account, options: { isDragging: boolean }) => ReactNode;
};

function AccountGridSortHint() {
  return (
    <p className={cn(o5SectionHeaderMutedClasses, "px-4 pt-3 pb-1.5")}>
      <span className="size-1.5 shrink-0 rounded-full bg-primary/60" />
      <span className="min-w-0 truncate">
        账号列表
        <span className={o5SectionHeaderHintClasses}> · 按住拖动排序</span>
      </span>
    </p>
  );
}

export function SortableAccountGrid({ accounts, columns, renderCard }: SortableAccountGridProps) {
  const { dragEnabled, activeId } = useAccountPanelSortable();

  if (!dragEnabled) {
    return (
      <div
        className="grid gap-3 p-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {accounts.map((account) => (
          <div key={account.id}>{renderCard(account, { isDragging: false })}</div>
        ))}
      </div>
    );
  }

  return (
    <SortableContext items={accounts.map((account) => account.id)} strategy={rectSortingStrategy}>
      <AccountGridSortHint />
      <div
        className="grid gap-3 px-4 pb-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {accounts.map((account) => (
          <SortableAccountCell
            key={account.id}
            id={account.id}
            isOverlaySource={account.id === activeId}
            layoutEnabled={activeId !== null}
          >
            {renderCard(account, { isDragging: account.id === activeId })}
          </SortableAccountCell>
        ))}
      </div>
    </SortableContext>
  );
}

function SortableAccountCell({
  id,
  isOverlaySource,
  layoutEnabled,
  children,
}: {
  id: string;
  isOverlaySource: boolean;
  layoutEnabled: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none select-none",
        (isDragging || isOverlaySource) && "opacity-35",
        !isDragging && "transition-opacity duration-200",
      )}
      {...attributes}
      {...listeners}
      title="按住拖动排序"
    >
      <motion.div
        layout={layoutEnabled ? "position" : false}
        initial={false}
        transition={{ type: "spring", stiffness: 500, damping: 38 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
