import type { ReactNode } from "react";

import { navItemClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";

type SidebarNavItemProps = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  trailing?: ReactNode;
  labelClassName?: string;
  className?: string;
  disabled?: boolean;
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
  appearance = "fill",
}: SidebarNavItemProps) {
  const isSoft = appearance === "soft";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-selected={selected}
      aria-disabled={disabled}
      className={cn(
        "relative flex w-full items-center gap-2 rounded-lg py-2 text-left text-sm",
        navItemClasses({ appearance, selected, disabled }),
        trailing ? "justify-between" : "justify-start",
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
      <span className={cn("min-w-0 flex-1", labelClassName)}>{children}</span>
      {trailing}
    </button>
  );
}
