import { Outlet } from "react-router-dom";

import { AppRail } from "@/components/app-rail/AppRail";

export function AppShell() {
  return (
    <div className="bg-background text-foreground flex h-svh overflow-hidden">
      <AppRail />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
