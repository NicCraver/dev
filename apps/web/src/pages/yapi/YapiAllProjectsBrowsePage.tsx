import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { YapiBrowseLayout } from "@/components/yapi/YapiBrowseLayout";
import { YAPI_BASE, useYapiAuth } from "@/hooks/useYapiAuth";
import { getInterface, listInterfaces, listMenu, listProjects } from "@/lib/yapi-api";
import { detailToIface, mapProjectToGlobalBrowse, yapiIdFromIfaceId } from "@/lib/yapi-project-map";
import type { Category, IfaceItem } from "@/lib/yapi-types";

export function YapiAllProjectsBrowsePage() {
  const navigate = useNavigate();
  const { logout } = useYapiAuth();

  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<IfaceItem[]>([]);
  const [details, setDetails] = useState<Record<string, IfaceItem>>({});
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());
  const [pageLoading, setPageLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState("");
  const [pageError, setPageError] = useState("");

  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setPageLoading(true);
    setPageError("");
    setLoadProgress("加载项目列表…");

    void (async () => {
      try {
        const projects = await listProjects();
        if (cancelled) return;
        if (!projects.length) {
          setCats([]);
          setItems([]);
          setLoadProgress("");
          return;
        }

        const allCats: Category[] = [];
        const allItems: IfaceItem[] = [];
        let done = 0;

        // 控制并发，避免一次打爆 YApi
        const concurrency = 4;
        let cursor = 0;

        async function worker() {
          while (cursor < projects.length) {
            const idx = cursor++;
            const p = projects[idx]!;
            if (cancelled) return;
            setLoadProgress(`加载接口 ${done + 1}/${projects.length}：${p.name}`);
            try {
              const [menu, list] = await Promise.all([listMenu(p._id), listInterfaces(p._id)]);
              if (cancelled) return;
              const mapped = mapProjectToGlobalBrowse(p._id, p.name, menu, list);
              allCats.push(...mapped.cats);
              allItems.push(...mapped.items);
            } catch {
              // 单个项目失败不阻断全局
            } finally {
              done++;
              if (!cancelled) {
                setLoadProgress(`加载接口 ${done}/${projects.length}`);
              }
            }
          }
        }

        await Promise.all(
          Array.from({ length: Math.min(concurrency, projects.length) }, () => worker()),
        );
        if (cancelled) return;

        setCats(allCats);
        setItems(allItems);
        const initialOpen: Record<string, boolean> = {};
        // 默认折叠，搜索时侧栏会自动展开匹配分类
        allCats.forEach((c) => {
          initialOpen[c.id] = false;
        });
        setOpen(initialOpen);
        setActiveId(allItems[0]?.id || "");
        setLoadProgress("");
      } catch (err) {
        if (!cancelled) setPageError(String((err as Error).message || err));
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
        const full = {
          ...detailToIface(data, stub.cat),
          projectId: stub.projectId,
        };
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

  const selectInterface = useCallback((id: string) => setActiveId(id), []);

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

  if (pageError && !items.length && !pageLoading) {
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

  if (!pageLoading && !items.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="border-border/60 max-w-md rounded-xl border bg-white p-6 text-center">
          <div className="text-muted-foreground text-sm">当前账号下暂无可访问接口。</div>
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
        projectTitle={pageLoading ? loadProgress || "全部接口" : `全部接口（${items.length}）`}
        onBack={() => navigate(`${YAPI_BASE}/projects`)}
        onLogout={handleLogout}
        showImport={false}
        showExport={false}
        getCachedDetail={getCachedDetail}
        yapiProjectId={iface?.projectId ?? null}
        emptyDetail={
          !pageLoading ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              暂无接口。
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
