import type { CSSProperties, ReactNode } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { motion } from "motion/react";

import { navItemClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";

const navTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

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
  /** 同列表内共享，用于选中高亮滑动动画 */
  selectionLayoutId?: string;
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
  selectionLayoutId,
}: SidebarNavItemProps) {
  const isSoft = appearance === "soft";
  const slideIndicator = Boolean(selectionLayoutId);

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
        "group relative flex w-full items-center gap-2 rounded-lg py-2 text-left text-sm",
        navItemClasses({ appearance, selected: slideIndicator ? false : selected, disabled }),
        slideIndicator && selected && !disabled && "pl-4 pr-3",
        trailing ? "justify-between" : "justify-start",
        sortable && "touch-none select-none cursor-grab active:cursor-grabbing",
        sortable?.isDragging && "opacity-35 shadow-md ring-2 ring-primary/20",
        className,
      )}
    >
      {slideIndicator && !disabled && (
        <motion.span
          initial={false}
          animate={{ opacity: selected ? 1 : 0 }}
          transition={navTransition}
          className={cn(
            "pointer-events-none absolute inset-0 rounded-lg",
            isSoft
              ? "bg-primary-soft group-hover:bg-primary-soft-hover group-active:bg-primary/15"
              : "bg-primary group-hover:bg-primary/90 group-active:bg-primary/80",
          )}
          aria-hidden
        />
      )}
      {selected && !disabled && slideIndicator && (
        <motion.span
          layoutId={`${selectionLayoutId}-indicator`}
          className={cn(
            "absolute top-2.5 bottom-2.5 left-1.5 z-1 w-0.5 rounded-full",
            isSoft ? "bg-primary" : "bg-primary-foreground",
          )}
          transition={navTransition}
        />
      )}
      {selected && !disabled && !slideIndicator && (
        <span
          className={cn(
            "absolute top-2.5 bottom-2.5 left-1.5 w-0.5 rounded-full transition-all duration-300",
            isSoft ? "bg-primary" : "bg-primary-foreground",
          )}
        />
      )}
      <span
        className={cn(
          "relative z-1 min-w-0 flex-1 truncate",
          selected && !disabled
            ? cn("font-semibold", isSoft ? "text-primary" : "text-primary-foreground")
            : cn("font-medium text-foreground", labelClassName),
        )}
      >
        {children}
      </span>
      {trailing ? <span className="relative z-1 shrink-0">{trailing}</span> : null}
    </button>
  );
}
