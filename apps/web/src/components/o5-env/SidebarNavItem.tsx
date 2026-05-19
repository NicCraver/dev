import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SidebarNavItemProps = {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  trailing?: ReactNode;
  labelClassName?: string;
  className?: string;
};

export function SidebarNavItem({
  selected,
  onClick,
  children,
  trailing,
  labelClassName,
  className,
}: SidebarNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-selected={selected}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-foreground hover:bg-accent",
        trailing ? "justify-between" : "justify-start",
        className,
      )}
    >
      <span className={cn("min-w-0 flex-1", labelClassName)}>{children}</span>
      {trailing}
    </button>
  );
}
