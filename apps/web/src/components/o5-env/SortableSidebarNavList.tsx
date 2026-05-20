import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { SidebarNavSortableProps } from "./SidebarNavItem";
import { useHoldToDragSensors } from "./useHoldToDragSensors";

export type { SidebarNavSortableProps };

type SortableSidebarNavListProps<T extends { id: string }> = {
  items: T[];
  listClassName?: string;
  onReorder: (activeId: string, overId: string) => void;
  renderItem: (item: T, sortable: SidebarNavSortableProps | null) => ReactNode;
};

export function SortableSidebarNavList<T extends { id: string }>({
  items,
  listClassName,
  onReorder,
  renderItem,
}: SortableSidebarNavListProps<T>) {
  const sensors = useHoldToDragSensors();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = items.find((item) => item.id === activeId);

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  if (items.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className={listClassName}>
          {items.map((item) => (
            <SortableSidebarNavItem
              key={item.id}
              id={item.id}
              isOverlaySource={item.id === activeId}
              renderItem={renderItem}
              item={item}
            />
          ))}
        </ul>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activeItem ? (
          <motion.div
            animate={{ scale: 1.02 }}
            className="cursor-grabbing rounded-lg shadow-lg ring-2 ring-primary/25"
          >
            {renderItem(activeItem, null)}
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableSidebarNavItem<T extends { id: string }>({
  id,
  item,
  isOverlaySource,
  renderItem,
}: {
  id: string;
  item: T;
  isOverlaySource: boolean;
  renderItem: SortableSidebarNavListProps<T>["renderItem"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sortable: SidebarNavSortableProps = {
    setNodeRef,
    style,
    attributes,
    listeners,
    isDragging: isDragging || isOverlaySource,
  };

  return (
    <motion.li
      layout="position"
      transition={{ type: "spring", stiffness: 500, damping: 38 }}
      className={cn(isOverlaySource && "opacity-40")}
    >
      {renderItem(item, sortable)}
    </motion.li>
  );
}
