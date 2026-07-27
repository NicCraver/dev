import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { YapiBrowseLayout } from "@/components/yapi/YapiBrowseLayout";
import { YAPI_BASE, useYapiAuth } from "@/hooks/useYapiAuth";
import { getInterface, listInterfaces, listMenu, listProjects } from "@/lib/yapi-api";
import {
  detailToIface,
  mapMenuToCategories,
  mergeListIntoMenuItems,
  yapiIdFromIfaceId,
} from "@/lib/yapi-project-map";
import type { Category, IfaceItem } from "@/lib/yapi-types";
import { Button } from "@/components/ui/button";

export function YapiProjectBrowsePage() {
  const { projectId, interfaceId } = useParams();
  const navigate = useNavigate();
  const { logout } = useYapiAuth();

  const pid = Number(projectId);
  const [projectName, setProjectName] = useState("");
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<IfaceItem[]>([]);
  const [details, setDetails] = useState<Record<string, IfaceItem>>({});
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [activeId, setActiveId] = useState(interfaceId || "");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!pid || Number.isNaN(pid)) return;
    void listProjects().then((list) => {
      const found = list.find((p) => p._id === pid);
      if (found) setProjectName(found.name);
    });
  }, [pid]);

  useEffect(() => {
    if (!pid || Number.isNaN(pid)) {
      setPageError("无效的项目 ID");
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    setPageError("");
    void Promise.all([listMenu(pid), listInterfaces(pid)])
      .then(([menu, list]) => {
        const nextCats = mapMenuToCategories(menu);
        const nextItems = mergeListIntoMenuItems(menu, list);
        setCats(nextCats);
        setItems(nextItems);
        const initialOpen: Record<string, boolean> = {};
        nextCats.forEach((c) => {
          initialOpen[c.id] = true;
        });
        setOpen(initialOpen);

        const firstId =
          interfaceId && nextItems.some((i) => i.id === interfaceId)
            ? interfaceId
            : nextItems[0]?.id || "";
        setActiveId(firstId);
        if (firstId && firstId !== interfaceId) {
          void navigate(`${YAPI_BASE}/projects/${pid}/${firstId}`, { replace: true });
        }
      })
      .catch((err) => setPageError(String((err as Error).message || err)))
      .finally(() => setPageLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  useEffect(() => {
    if (!interfaceId) return;
    setActiveId((prev) => {
      if (prev === interfaceId) return prev;
      return items.some((i) => i.id === interfaceId) ? interfaceId : prev;
    });
  }, [interfaceId, items]);

  const loadDetail = useCallback(
    async (id: string) => {
      if (details[id]?.synced) return;
      const stub = items.find((i) => i.id === id);
      if (!stub) return;
      setLoadedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      try {
        const data = await getInterface(yapiIdFromIfaceId(id));
        const catId = stub.cat || String(data.catid || "");
        const full = detailToIface(data, catId);
        setDetails((prev) => ({ ...prev, [id]: full }));
      } catch (err) {
        setPageError(String((err as Error).message || err));
      } finally {
        setLoadedIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }
    },
    [details, items],
  );

  useEffect(() => {
    if (!activeId) return;
    void loadDetail(activeId);
  }, [activeId, loadDetail]);

  const selectInterface = useCallback(
    (id: string) => {
      setActiveId(id);
      void navigate(`${YAPI_BASE}/projects/${pid}/${id}`);
    },
    [navigate, pid],
  );

  const displayedItems = useMemo(() => items.map((it) => details[it.id] || it), [items, details]);

  const iface = useMemo(
    () => displayedItems.find((i) => i.id === activeId) || displayedItems[0],
    [displayedItems, activeId],
  );

  const cat = useMemo(() => cats.find((c) => c.id === iface?.cat) ?? null, [cats, iface]);

  const getCachedDetail = useCallback((id: string) => details[id], [details]);

  const handleLogout = () => {
    void logout().then(() => navigate(`${YAPI_BASE}/login`, { replace: true }));
  };

  if (pageError && !items.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="border-border/60 max-w-md rounded-xl border bg-white p-6 text-center">
          <div className="text-destructive text-sm">{pageError}</div>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => navigate(`${YAPI_BASE}/projects`)}
          >
            返回项目列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <YapiBrowseLayout
        cats={cats}
        items={displayedItems}
        activeId={activeId}
        query={query}
        setQuery={setQuery}
        open={open}
        setOpen={setOpen}
        onSelect={selectInterface}
        iface={iface}
        cat={cat}
        pageLoading={pageLoading}
        detailLoading={!!iface && !iface.synced && !loadedIds.has(iface.id)}
        projectTitle={projectName || `项目 #${pid}`}
        onBack={() => navigate(`${YAPI_BASE}/projects`)}
        onLogout={handleLogout}
        showImport={false}
        getCachedDetail={getCachedDetail}
        yapiProjectId={pid}
        emptyDetail={
          !pageLoading ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              该项目暂无接口。
            </div>
          ) : undefined
        }
      />
      {pageError ? (
        <div className="bg-destructive/10 text-destructive absolute bottom-4 right-4 rounded-lg px-3 py-2 text-xs shadow-sm">
          {pageError}
        </div>
      ) : null}
    </div>
  );
}
