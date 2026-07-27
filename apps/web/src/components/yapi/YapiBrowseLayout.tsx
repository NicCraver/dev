import { type ReactNode } from "react";
import { useDefaultLayout } from "react-resizable-panels";

import { YapiCategorySidebar } from "@/components/yapi/YapiCategorySidebar";
import { YapiInterfaceDetail } from "@/components/yapi/YapiInterfaceDetail";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { Category, IfaceItem } from "@/lib/yapi-types";

type YapiBrowseLayoutProps = {
  cats: Category[];
  items: IfaceItem[];
  activeId: string;
  query: string;
  setQuery: (v: string) => void;
  open: Record<string, boolean>;
  setOpen: (v: Record<string, boolean>) => void;
  onSelect: (id: string) => void;
  iface: IfaceItem | undefined;
  cat: Category | null;
  detailLoading?: boolean;
  pageLoading?: boolean;
  projectTitle?: string;
  onRenameProject?: (name: string) => void;
  onBack?: () => void;
  onLogout?: () => void;
  showImport?: boolean;
  onOpenImport?: () => void;
  showExport?: boolean;
  onOpenExport?: () => void;
  addLabel?: string;
  onDeleteCat?: (catId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onAddToSubcat?: (subcatId: string, subcatName: string) => void;
  sortable?: boolean;
  onReorderItems?: (subcatId: string, activeId: string, overId: string) => void;
  emptyDetail?: ReactNode;
  getCachedDetail?: (id: string) => IfaceItem | undefined;
  yapiProjectId?: number | null;
};

export function YapiBrowseLayout({
  cats,
  items,
  activeId,
  query,
  setQuery,
  open,
  setOpen,
  onSelect,
  iface,
  cat,
  detailLoading,
  pageLoading,
  projectTitle,
  onRenameProject,
  onBack,
  onLogout,
  showImport,
  onOpenImport,
  showExport,
  onOpenExport,
  addLabel,
  onDeleteCat,
  onDeleteItem,
  onAddToSubcat,
  sortable,
  onReorderItems,
  emptyDetail,
  getCachedDetail,
  yapiProjectId,
}: YapiBrowseLayoutProps) {
  const layout = useDefaultLayout({
    id: "yapi-browse",
    panelIds: ["sidebar", "detail"],
  });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ResizablePanelGroup
        id="yapi-browse"
        className="min-h-0 flex-1"
        defaultLayout={layout.defaultLayout}
        onLayoutChanged={layout.onLayoutChanged}
      >
        <ResizablePanel
          id="sidebar"
          defaultSize="34%"
          minSize="26%"
          maxSize="50%"
          className="border-border/60 flex min-h-0 min-w-0 flex-col overflow-hidden border-r bg-[#fcfcfe]"
        >
          <YapiCategorySidebar
            cats={cats}
            items={items}
            activeId={activeId}
            query={query}
            setQuery={setQuery}
            open={open}
            setOpen={setOpen}
            onSelect={onSelect}
            projectTitle={projectTitle}
            onRenameProject={onRenameProject}
            onBack={onBack}
            onLogout={onLogout}
            showImport={showImport}
            onOpenImport={onOpenImport}
            showExport={showExport}
            onOpenExport={onOpenExport}
            addLabel={addLabel}
            onDeleteCat={onDeleteCat}
            onDeleteItem={onDeleteItem}
            onAddToSubcat={onAddToSubcat}
            loading={pageLoading}
            sortable={sortable}
            onReorderItems={onReorderItems}
            getCachedDetail={getCachedDetail}
          />
        </ResizablePanel>

        <ResizableHandle withHandle variant="vertical" className="bg-border shrink-0" />

        <ResizablePanel
          id="detail"
          minSize="42%"
          className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#f8fafc]"
        >
          {iface ? (
            <YapiInterfaceDetail
              iface={iface}
              cat={cat}
              loading={detailLoading}
              onDeleteItem={onDeleteItem}
              getCachedDetail={getCachedDetail}
              yapiProjectId={yapiProjectId}
            />
          ) : (
            (emptyDetail ?? (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                请选择接口
              </div>
            ))
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
