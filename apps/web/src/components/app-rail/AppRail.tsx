import { modules } from "@/app/modules";

import { AppRailItem } from "./AppRailItem";

export function AppRail() {
  return (
    <nav
      className="bg-card flex w-14 shrink-0 flex-col items-center gap-1 border-r py-3"
      aria-label="应用导航"
    >
      {modules.map((m) => (
        <AppRailItem
          key={m.id}
          to={m.navPath}
          label={m.label}
          icon={m.icon}
          matchPrefix={m.navMatchPrefix}
        />
      ))}
    </nav>
  );
}
