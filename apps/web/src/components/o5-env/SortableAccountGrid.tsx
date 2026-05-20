import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { O5Account } from "@/types/o5-env";

import { useAccountPanelSortable } from "./AccountPanelSortable";

type SortableAccountGridProps = {
  accounts: O5Account[];
  columns: number;
  renderCard: (account: O5Account, options: { isDragging: boolean }) => ReactNode;
};

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
      <div
        className="grid gap-3 p-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {accounts.map((account) => (
          <SortableAccountCell
            key={account.id}
            id={account.id}
            isOverlaySource={account.id === activeId}
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
  children,
}: {
  id: string;
  isOverlaySource: boolean;
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
      <motion.div layout="position" transition={{ type: "spring", stiffness: 500, damping: 38 }}>
        {children}
      </motion.div>
    </div>
  );
}
