import { useMemo, useState } from "react";
import { useDefaultLayout } from "react-resizable-panels";

import { AccountCardList } from "@/components/o5-env/AccountCardList";
import { EnvironmentList } from "@/components/o5-env/EnvironmentList";
import { SystemList } from "@/components/o5-env/SystemList";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { o5Accounts, o5Environments, o5Systems } from "@/mocks/o5-env";

const DEFAULT_SYSTEM_ID = "okr";
const DEFAULT_ENV_ID = "env-action-6173";

export function O5EnvPage() {
  const [selectedSystemId, setSelectedSystemId] = useState(DEFAULT_SYSTEM_ID);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(DEFAULT_ENV_ID);

  const mainLayout = useDefaultLayout({
    id: "o5-env-main",
    panelIds: ["sidebar", "accounts"],
  });

  const sidebarLayout = useDefaultLayout({
    id: "o5-env-sidebar",
    panelIds: ["systems", "environments"],
  });

  const environmentsForSystem = useMemo(
    () => o5Environments.filter((env) => env.systemId === selectedSystemId),
    [selectedSystemId],
  );

  const selectedEnvironment = useMemo(
    () => o5Environments.find((env) => env.id === selectedEnvId) ?? null,
    [selectedEnvId],
  );

  const accountsForEnv = useMemo(
    () => o5Accounts.filter((account) => account.envId === selectedEnvId),
    [selectedEnvId],
  );

  const handleSystemSelect = (systemId: string) => {
    setSelectedSystemId(systemId);
    const firstEnv = o5Environments.find((env) => env.systemId === systemId);
    setSelectedEnvId(firstEnv?.id ?? null);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-white">
      <ResizablePanelGroup
        id="o5-env-main"
        className="h-full"
        defaultLayout={mainLayout.defaultLayout}
        onLayoutChanged={mainLayout.onLayoutChanged}
      >
        <ResizablePanel
          id="sidebar"
          defaultSize="22%"
          minSize="14%"
          maxSize="42%"
          className="border-border/60 bg-[#fcfcfe] dark:bg-neutral-900 text-foreground border-r"
        >
          <ResizablePanelGroup
            id="o5-env-sidebar"
            orientation="vertical"
            className="h-full"
            defaultLayout={sidebarLayout.defaultLayout}
            onLayoutChanged={sidebarLayout.onLayoutChanged}
          >
            <ResizablePanel
              id="systems"
              defaultSize="38%"
              minSize="22%"
              maxSize="62%"
              className="flex flex-col"
            >
              <SystemList
                systems={o5Systems}
                selectedId={selectedSystemId}
                onSelect={handleSystemSelect}
              />
            </ResizablePanel>
            <ResizableHandle withHandle variant="horizontal" className="bg-border shrink-0" />
            <ResizablePanel id="environments" minSize="28%" className="flex flex-col">
              <EnvironmentList
                environments={environmentsForSystem}
                selectedId={selectedEnvId}
                onSelect={setSelectedEnvId}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle variant="vertical" />

        <ResizablePanel
          id="accounts"
          minSize="35%"
          className="flex flex-col bg-[#f8fafc] dark:bg-neutral-950/40"
        >
          <AccountCardList
            accounts={accountsForEnv}
            environmentName={selectedEnvironment?.name ?? null}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
