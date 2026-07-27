import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type CSSProperties, type ReactNode, useState } from "react";

import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

import type { IfaceItem } from "@/lib/yapi-types";

export type YapiDragHandleProps = {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
};

type YapiSortableIfaceListProps = {
  items: IfaceItem[];
  enabled: boolean;
  onReorder: (activeId: string, overId: string) => void;
  renderItem: (
    item: IfaceItem,
    ctx: { dragHandle: YapiDragHandleProps | null; isDragging: boolean },
  ) => ReactNode;
  overlayClassName?: string;
};

function useIfaceSortableSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

export function YapiSortableIfaceList({
  items,
  enabled,
  onReorder,
  renderItem,
  overlayClassName,
}: YapiSortableIfaceListProps) {
  const sensors = useIfaceSortableSensors();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = items.find((item) => item.id === activeId);

  if (!enabled || items.length < 2) {
    return <>{items.map((item) => renderItem(item, { dragHandle: null, isDragging: false }))}</>;
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableIfaceRow
            key={item.id}
            id={item.id}
            item={item}
            isOverlaySource={item.id === activeId}
            renderItem={renderItem}
          />
        ))}
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activeItem ? (
          <div className={overlayClassName}>
            {renderItem(activeItem, { dragHandle: null, isDragging: true })}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableIfaceRow({
  id,
  item,
  isOverlaySource,
  renderItem,
}: {
  id: string;
  item: IfaceItem;
  isOverlaySource: boolean;
  renderItem: YapiSortableIfaceListProps["renderItem"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isOverlaySource ? "opacity-40" : undefined}>
      {renderItem(item, {
        dragHandle: { attributes, listeners },
        isDragging: isDragging || isOverlaySource,
      })}
    </div>
  );
}
