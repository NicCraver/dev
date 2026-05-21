import { useEffect, useMemo, useState } from "react";
import { useDefaultLayout } from "react-resizable-panels";

import { AccountCardList } from "@/components/o5-env/AccountCardList";
import { EnvironmentList } from "@/components/o5-env/EnvironmentList";
import { SystemList } from "@/components/o5-env/SystemList";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useO5EnvData } from "@/hooks/useO5EnvData";
import { useO5EnvironmentOrder } from "@/hooks/useO5EnvironmentOrder";
import { useO5SystemOrder } from "@/hooks/useO5SystemOrder";

export function O5EnvPage() {
  const {
    systems,
    environmentsBySystem,
    accountsBySystem,
    loading,
    error,
    writable,
    refetch,
    persistSelection,
    resolveInitialEnvId,
    lastActiveSystemName,
  } = useO5EnvData();

  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const { sortSystems, reorderSystems } = useO5SystemOrder();
  const { sortEnvironments, reorderEnvironments } = useO5EnvironmentOrder(selectedSystemId);

  const mainLayout = useDefaultLayout({
    id: "o5-env-main",
    panelIds: ["sidebar", "accounts"],
  });

  const sidebarLayout = useDefaultLayout({
    id: "o5-env-sidebar",
    panelIds: ["systems", "environments"],
  });

  const orderedSystems = useMemo(() => sortSystems(systems), [systems, sortSystems]);

  useEffect(() => {
    if (orderedSystems.length === 0 || selectedSystemId) return;

    const byName = lastActiveSystemName
      ? orderedSystems.find((s) => s.name === lastActiveSystemName)
      : undefined;
    const initial =
      byName ??
      orderedSystems.find((s) => s.name === "测试环境" || s.name === "测试") ??
      orderedSystems[0];
    if (!initial) return;

    const envs = environmentsBySystem[initial.id] ?? [];
    const envId = resolveInitialEnvId(initial.id, envs);
    setSelectedSystemId(initial.id);
    setSelectedEnvId(envId);
    const env = envId ? envs.find((e) => e.id === envId) : undefined;
    persistSelection(initial.name, env?.name);
  }, [
    orderedSystems,
    selectedSystemId,
    environmentsBySystem,
    resolveInitialEnvId,
    lastActiveSystemName,
    persistSelection,
  ]);

  const environmentsForSystem = useMemo(() => {
    const envs = selectedSystemId ? (environmentsBySystem[selectedSystemId] ?? []) : [];
    return sortEnvironments(envs);
  }, [selectedSystemId, environmentsBySystem, sortEnvironments]);

  const selectedSystem = useMemo(
    () => orderedSystems.find((s) => s.id === selectedSystemId) ?? null,
    [orderedSystems, selectedSystemId],
  );

  const selectedEnvironment = useMemo(
    () => environmentsForSystem.find((env) => env.id === selectedEnvId) ?? null,
    [environmentsForSystem, selectedEnvId],
  );

  const accountsForSystem = useMemo(
    () => (selectedSystemId ? (accountsBySystem[selectedSystemId] ?? []) : []),
    [selectedSystemId, accountsBySystem],
  );

  const handleSystemSelect = (systemId: string) => {
    setSelectedSystemId(systemId);
    const envs = environmentsBySystem[systemId] ?? [];
    const envId = resolveInitialEnvId(systemId, envs);
    setSelectedEnvId(envId);
    const system = orderedSystems.find((s) => s.id === systemId);
    const env = envId ? envs.find((e) => e.id === envId) : undefined;
    if (system) {
      persistSelection(system.name, env?.name);
    }
  };

  const handleEnvSelect = (envId: string) => {
    setSelectedEnvId(envId);
    const env = environmentsForSystem.find((e) => e.id === envId);
    if (selectedSystem && env) {
      persistSelection(selectedSystem.name, env.name);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
        加载环境数据…
      </div>
    );
  }

  if (error && systems.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <ResizablePanelGroup
        id="o5-env-main"
        className="h-full min-h-0 flex-1"
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
                systems={orderedSystems}
                selectedId={selectedSystemId}
                onSelect={handleSystemSelect}
                onReorder={(activeId, overId) => reorderSystems(orderedSystems, activeId, overId)}
              />
            </ResizablePanel>
            <ResizableHandle withHandle variant="horizontal" className="bg-border shrink-0" />
            <ResizablePanel id="environments" minSize="28%" className="flex flex-col">
              <EnvironmentList
                environments={environmentsForSystem}
                selectedId={selectedEnvId}
                systemKvId={selectedSystem?.name ?? null}
                writable={writable}
                onSelect={handleEnvSelect}
                onReorder={(activeId, overId) =>
                  reorderEnvironments(environmentsForSystem, activeId, overId)
                }
                onRefetch={() => void refetch()}
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
            accounts={accountsForSystem}
            environmentName={selectedEnvironment?.name ?? null}
            systemKvId={selectedSystem?.name ?? null}
            writable={writable}
            targetUrl={selectedEnvironment?.url ?? null}
            windowFeatures={selectedEnvironment?.features}
            onRefetch={() => void refetch()}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
