import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import { cn } from "@/lib/utils";

type IconProps = {
  icon: IconSvgElement;
  className?: string;
  strokeWidth?: number;
};

export function Icon({ icon, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      className={cn("shrink-0", className)}
      strokeWidth={strokeWidth}
      color="currentColor"
    />
  );
}

export type { IconSvgElement };
