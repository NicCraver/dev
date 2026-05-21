import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

import { cn } from "@/lib/utils";
import type { O5Account } from "@/types/o5-env";

import { useAccountPanelSortable } from "./AccountPanelSortable";

export type FavoriteSortableProps = {
  setNodeRef: (node: HTMLElement | null) => void;
  style: React.CSSProperties;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
};

type SortableFavoritesRowProps = {
  accounts: O5Account[];
  renderChip: (account: O5Account, sortable: FavoriteSortableProps | null) => React.ReactNode;
};

export function SortableFavoritesRow({ accounts, renderChip }: SortableFavoritesRowProps) {
  const { dragEnabled, activeId } = useAccountPanelSortable();

  if (!dragEnabled) {
    return (
      <div className="flex flex-wrap gap-2">
        {accounts.map((account) => (
          <div key={account.id}>{renderChip(account, null)}</div>
        ))}
      </div>
    );
  }

  return (
    <SortableContext items={accounts.map((account) => account.id)} strategy={rectSortingStrategy}>
      <div className="flex flex-wrap gap-2">
        {accounts.map((account) => (
          <SortableFavoriteCell
            key={account.id}
            id={account.id}
            isOverlaySource={account.id === activeId}
            layoutEnabled={activeId !== null}
            renderChip={renderChip}
            account={account}
          />
        ))}
      </div>
    </SortableContext>
  );
}

function SortableFavoriteCell({
  id,
  account,
  isOverlaySource,
  layoutEnabled,
  renderChip,
}: {
  id: string;
  account: O5Account;
  isOverlaySource: boolean;
  layoutEnabled: boolean;
  renderChip: SortableFavoritesRowProps["renderChip"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sortable: FavoriteSortableProps = {
    setNodeRef,
    style,
    attributes,
    listeners,
    isDragging: isDragging || isOverlaySource,
  };

  return (
    <motion.div
      layout={layoutEnabled ? "position" : false}
      initial={false}
      transition={{ type: "spring", stiffness: 520, damping: 36 }}
      className={cn(isOverlaySource && "opacity-40")}
    >
      {renderChip(account, sortable)}
    </motion.div>
  );
}
