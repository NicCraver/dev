import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Icon, type IconSvgElement } from "@/components/ui/icon";
import { appRailButtonClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";

type AppRailItemProps = {
  to: string;
  label: string;
  icon: IconSvgElement;
};

export function AppRailItem({ to, label, icon }: AppRailItemProps) {
  return (
    <NavLink to={to} title={label} end>
      {({ isActive }) => (
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-10", appRailButtonClasses(isActive))}
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon icon={icon} className="size-5" />
        </Button>
      )}
    </NavLink>
  );
}
