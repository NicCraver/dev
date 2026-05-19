import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppRailItemProps = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export function AppRailItem({ to, label, icon: Icon }: AppRailItemProps) {
  return (
    <NavLink to={to} title={label} end>
      {({ isActive }) => (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-10",
            isActive &&
              "bg-cosmic-violet text-crystal-white hover:bg-cosmic-violet/90 hover:text-crystal-white",
          )}
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon className="size-5" />
        </Button>
      )}
    </NavLink>
  );
}
