import type { CSSProperties, ReactNode } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

import { navItemClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";

export type SidebarNavSortableProps = {
  setNodeRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
};

type SidebarNavItemProps = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  trailing?: ReactNode;
  labelClassName?: string;
  className?: string;
  disabled?: boolean;
  sortable?: SidebarNavSortableProps | null;
  /** `soft` = light primary tint + primary text; `fill` = solid primary pill */
  appearance?: "soft" | "fill";
};

export function SidebarNavItem({
  selected,
  onClick,
  children,
  trailing,
  labelClassName,
  className,
  disabled = false,
  sortable = null,
  appearance = "fill",
}: SidebarNavItemProps) {
  const isSoft = appearance === "soft";

  return (
    <button
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      {...sortable?.attributes}
      {...sortable?.listeners}
      type="button"
      onClick={() => {
        if (sortable?.isDragging) return;
        onClick();
      }}
      disabled={disabled}
      aria-selected={selected}
      aria-disabled={disabled}
      title={
        typeof children === "string"
          ? sortable
            ? `${children} · 按住拖动排序`
            : children
          : sortable
            ? "按住拖动排序"
            : undefined
      }
      className={cn(
        "relative flex w-full items-center gap-2 rounded-lg py-2 text-left text-sm",
        navItemClasses({ appearance, selected, disabled }),
        trailing ? "justify-between" : "justify-start",
        sortable && "touch-none select-none cursor-grab active:cursor-grabbing",
        sortable?.isDragging && "opacity-35 shadow-md ring-2 ring-primary/20",
        className,
      )}
    >
      {selected && !disabled && (
        <span
          className={cn(
            "absolute left-1.5 top-2.5 bottom-2.5 w-0.5 rounded-full transition-all duration-300",
            isSoft ? "bg-primary" : "bg-primary-foreground",
          )}
        />
      )}
      <span className={cn("min-w-0 flex-1 truncate font-medium", labelClassName)}>{children}</span>
      {trailing}
    </button>
  );
}
