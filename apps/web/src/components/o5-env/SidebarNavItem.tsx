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
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-[background-color,box-shadow,color] duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-starlight-violet/50",
        selected
          ? "bg-cosmic-violet text-crystal-white shadow-md hover:bg-cosmic-violet/90"
          : "text-lunar-dust hover:bg-twilight-indigo/60 hover:text-crystal-white",
        trailing ? "justify-between" : "justify-start",
        className,
      )}
    >
      <span className={cn("min-w-0 flex-1", labelClassName)}>{children}</span>
      {trailing}
    </button>
  );
}
