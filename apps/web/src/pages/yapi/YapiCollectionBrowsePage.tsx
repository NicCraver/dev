import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { YapiBrowseLayout } from "@/components/yapi/YapiBrowseLayout";
import { YapiExportDialog } from "@/components/yapi/YapiExportDialog";
import { YapiImportModal } from "@/components/yapi/YapiImportModal";
import { Button } from "@/components/ui/button";
import { YAPI_BASE, useYapiAuth } from "@/hooks/useYapiAuth";
import { getInterface } from "@/lib/yapi-api";
import {
  addItemsToSubcat,
  addSubcat,
  allCollectionItems,
  collectionSubcatsToCategories,
  genSubcatId,
  loadCollections,
  removeItemFromSubcat,
  removeSubcat,
  renameCollection,
  reorderSubcatItems,
  flattenCollectionItems,
} from "@/lib/yapi-collections";
import { detailToIface, yapiIdFromIfaceId } from "@/lib/yapi-project-map";
import { importYapiLines, parseYapiImportText } from "@/lib/yapi-import";
import type { Category, IfaceItem, ImportMessage } from "@/lib/yapi-types";
import type { ExportScope } from "@/lib/yapi-export";

export function YapiCollectionBrowsePage() {
  const { catId } = useParams();
  const navigate = useNavigate();
  const { logout } = useYapiAuth();

  const isAll = !catId;

  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<IfaceItem[]>([]);
  const [details, setDetails] = useState<Record<string, IfaceItem>>({});
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());
  const [pageError, setPageError] = useState("");
  const [ready, setReady] = useState(false);

  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [collectionName, setCollectionName] = useState("");

  const [subOpen, setSubOpen] = useState(false);
  const [subName, setSubName] = useState("");
  const [subText, setSubText] = useState("");
  const [subImporting, setSubImporting] = useState(false);
  const [subMsg, setSubMsg] = useState<ImportMessage | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const [addToSubcatOpen, setAddToSubcatOpen] = useState(false);
  const [addToSubcatId, setAddToSubcatId] = useState("");
  const [addToSubcatName, setAddToSubcatName] = useState("");
  const [addToSubcatText, setAddToSubcatText] = useState("");
  const [addToSubcatImporting, setAddToSubcatImporting] = useState(false);
  const [addToSubcatMsg, setAddToSubcatMsg] = useState<ImportMessage | null>(null);
  const [addToSubcatReplace, setAddToSubcatReplace] = useState(true);

  useEffect(() => {
    const list = loadCollections();
    let nextCats: Category[];
    let nextItems: IfaceItem[];
    if (isAll) {
      const merged = allCollectionItems(list);
      nextCats = merged.cats;
      nextItems = merged.items;
    } else {
      const c = list.find((x) => x.id === catId);
      nextCats = c ? collectionSubcatsToCategories(c) : [];
      nextItems = c ? (c.subcats || []).flatMap((s) => s.items) : [];
      setCollectionName(c?.name || "自定义分类");
    }
    setCats(nextCats);
    setItems(nextItems);
    const initialOpen: Record<string, boolean> = {};
    nextCats.forEach((c) => {
      initialOpen[c.id] = true;
    });
    setOpen(initialOpen);
    setActiveId(nextItems[0]?.id || "");
    setReady(true);
  }, [catId, isAll]);

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
        const full = detailToIface(data, stub.cat);
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

  const onDeleteCat = useCallback(
    (subcatId: string) => {
      if (!catId) return;
      removeSubcat(catId, subcatId);
      const list = loadCollections();
      const c = list.find((x) => x.id === catId);
      const nextCats = c ? collectionSubcatsToCategories(c) : [];
      const nextItems = c ? (c.subcats || []).flatMap((s) => s.items) : [];
      setCats(nextCats);
      setItems(nextItems);
      if (!nextItems.some((i) => i.id === activeId)) {
        setActiveId(nextItems[0]?.id || "");
      }
    },
    [catId, activeId],
  );

  const onDeleteItem = useCallback(
    (itemId: string) => {
      if (!catId) return;
      const target = items.find((i) => i.id === itemId);
      if (!target) return;
      removeItemFromSubcat(catId, target.cat, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setDetails((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      if (activeId === itemId) {
        const rest = items.filter((i) => i.id !== itemId);
        setActiveId(rest[0]?.id || "");
      }
    },
    [catId, activeId, items],
  );

  const onReorderItems = useCallback(
    (subcatId: string, dragActiveId: string, overId: string) => {
      if (!catId || isAll) return;
      const ok = reorderSubcatItems(catId, subcatId, dragActiveId, overId);
      if (!ok) return;
      const c = loadCollections().find((x) => x.id === catId);
      if (!c) return;
      setItems(flattenCollectionItems(c));
    },
    [catId, isAll],
  );

  const doImportSubcat = async () => {
    if (!catId) return;
    const parsed = parseYapiImportText(subText);
    if (!parsed.length) {
      setSubMsg({ type: "err", text: "未解析到有效的 YApi 接口链接。" });
      return;
    }
    setSubImporting(true);
    setSubMsg({ type: "", text: `正在同步 ${parsed.length} 个接口…` });
    let synced = 0;
    let failed = 0;
    const subcatId = genSubcatId();
    const imported = await importYapiLines(subText, subcatId, (p) => {
      if (p.ok) synced++;
      else failed++;
      setSubMsg({
        type: "",
        text: `同步中… 成功 ${synced}，失败 ${failed} / 共 ${parsed.length}`,
      });
    });
    setSubImporting(false);
    addSubcat(catId, subcatId, subName, imported);
    const list = loadCollections();
    const c = list.find((x) => x.id === catId);
    const nextCats = c ? collectionSubcatsToCategories(c) : [];
    const nextItems = c ? (c.subcats || []).flatMap((s) => s.items) : [];
    setCats(nextCats);
    setItems(nextItems);
    setOpen((prev) => ({ ...prev, [subcatId]: true }));
    setSubMsg({
      type: failed ? "err" : "ok",
      text: `已添加细分分类「${subName || "未命名细分"}」，共 ${imported.length} 个接口${
        failed ? `（${failed} 个同步失败，稍后可重试）` : "。"
      }`,
    });
    if (!failed) {
      const firstNew = imported[0]?.id || "";
      if (firstNew) setActiveId(firstNew);
      window.setTimeout(() => {
        setSubOpen(false);
        setSubName("");
        setSubText("");
        setSubMsg(null);
      }, 700);
    }
  };

  const openAddToSubcat = useCallback((subcatId: string, subcatName: string) => {
    setAddToSubcatId(subcatId);
    setAddToSubcatName(subcatName);
    setAddToSubcatText("");
    setAddToSubcatMsg(null);
    setAddToSubcatReplace(true);
    setAddToSubcatOpen(true);
    setOpen((prev) => ({ ...prev, [subcatId]: true }));
  }, []);

  const doImportToSubcat = async () => {
    if (!catId || !addToSubcatId) return;
    const parsed = parseYapiImportText(addToSubcatText);
    if (!parsed.length) {
      setAddToSubcatMsg({
        type: "err",
        text: "未解析到有效的 YApi 接口链接。请粘贴完整 URL，例如：192.168.5.46:3100/project/255/interface/api/14142",
      });
      return;
    }
    setAddToSubcatImporting(true);
    setAddToSubcatMsg({ type: "", text: `正在同步 ${parsed.length} 个接口…` });
    let synced = 0;
    let failed = 0;
    const imported = await importYapiLines(addToSubcatText, addToSubcatId, (p) => {
      if (p.ok) synced++;
      else failed++;
      setAddToSubcatMsg({
        type: "",
        text: `同步中… 成功 ${synced}，失败 ${failed} / 共 ${parsed.length}`,
      });
    });
    setAddToSubcatImporting(false);
    const { added, updated, skipped, skippedTitles } = addItemsToSubcat(
      catId,
      addToSubcatId,
      imported,
      { replaceExisting: addToSubcatReplace },
    );
    const touched = [...added, ...updated];
    if (touched.length) {
      setDetails((prev) => {
        const next = { ...prev };
        for (const it of touched) next[it.id] = it;
        return next;
      });
    }
    const list = loadCollections();
    const c = list.find((x) => x.id === catId);
    const nextCats = c ? collectionSubcatsToCategories(c) : [];
    const nextItems = c ? (c.subcats || []).flatMap((s) => s.items) : [];
    setCats(nextCats);
    setItems(nextItems);

    const parts: string[] = [];
    if (added.length) parts.push(`新增 ${added.length} 个`);
    if (updated.length) {
      const names = updated.map((i) => `「${i.title}」`).join("、");
      parts.push(`更新 ${updated.length} 个${names ? `：${names}` : ""}`);
    }
    if (skipped) {
      const names = skippedTitles.map((t) => `「${t}」`).join("、");
      parts.push(`跳过重复 ${skipped} 个${names ? `：${names}` : ""}`);
    }
    if (failed) parts.push(`${failed} 个同步失败`);
    const ok = touched.length > 0 || (skipped > 0 && !failed);
    setAddToSubcatMsg({
      type: failed && !touched.length ? "err" : ok ? "ok" : "err",
      text:
        touched.length || skipped || failed
          ? `已导入到「${addToSubcatName}」${parts.length ? `：${parts.join("，")}` : ""}${
              failed && touched.length ? "（部分同步失败，已保存为待同步条目）" : "。"
            }`
          : `未能添加到「${addToSubcatName}」，请检查链接是否正确。`,
    });
    if (touched.length) {
      const first = touched[0]?.id || "";
      if (first) setActiveId(first);
      if (!failed || touched.length) {
        window.setTimeout(
          () => {
            setAddToSubcatOpen(false);
            setAddToSubcatId("");
            setAddToSubcatName("");
            setAddToSubcatText("");
            setAddToSubcatMsg(null);
            setAddToSubcatReplace(true);
          },
          updated.length ? 1200 : 700,
        );
      }
    }
  };

  const displayedItems = useMemo(() => items.map((it) => details[it.id] || it), [items, details]);

  const iface = useMemo(
    () => displayedItems.find((i) => i.id === activeId) || displayedItems[0],
    [displayedItems, activeId],
  );

  const cat = useMemo(() => cats.find((c) => c.id === iface?.cat) ?? null, [cats, iface]);

  const projectTitle = isAll ? "全部接口" : collectionName || "自定义分类";

  const exportScope = useMemo((): ExportScope | null => {
    if (!items.length) return null;
    if (isAll) {
      return { mode: "all", collections: loadCollections() };
    }
    if (!catId) return null;
    const c = loadCollections().find((x) => x.id === catId);
    if (!c) return null;
    return { mode: "collection", collection: c };
  }, [isAll, items.length, catId, items]);

  const getCachedDetail = useCallback((id: string) => details[id], [details]);

  const onRenameProject = useCallback(
    (name: string) => {
      if (!catId) return;
      renameCollection(catId, name);
      setCollectionName(name);
    },
    [catId],
  );

  const handleLogout = () => {
    void logout().then(() => navigate(`${YAPI_BASE}/login`, { replace: true }));
  };

  if (isAll && ready && !items.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="border-border/60 max-w-md rounded-xl border bg-white p-6 text-center">
          <div className="text-muted-foreground text-sm">还没有收藏的接口。</div>
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
        iface={ready ? iface : undefined}
        cat={cat}
        detailLoading={!!iface && !iface.synced && !loadedIds.has(iface.id)}
        projectTitle={projectTitle}
        onRenameProject={isAll ? undefined : onRenameProject}
        onBack={() => navigate(`${YAPI_BASE}/projects`)}
        onLogout={handleLogout}
        showImport={!isAll}
        onOpenImport={isAll ? undefined : () => setSubOpen(true)}
        showExport={items.length > 0}
        onOpenExport={() => setExportOpen(true)}
        addLabel="添加细分分类"
        onDeleteCat={isAll ? undefined : onDeleteCat}
        onDeleteItem={isAll ? undefined : onDeleteItem}
        onAddToSubcat={isAll ? undefined : openAddToSubcat}
        sortable={!isAll}
        onReorderItems={isAll ? undefined : onReorderItems}
        getCachedDetail={getCachedDetail}
        emptyDetail={
          <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
            该分类暂无接口，点左侧「添加细分分类」开始收集。
          </div>
        }
      />
      {pageError ? (
        <div className="bg-destructive/10 text-destructive absolute bottom-4 right-4 rounded-lg px-3 py-2 text-xs shadow-sm">
          {pageError}
        </div>
      ) : null}
      {!isAll && (
        <YapiImportModal
          open={subOpen}
          onClose={() => {
            if (subImporting) return;
            setSubOpen(false);
            setSubName("");
            setSubText("");
            setSubMsg(null);
          }}
          catName={subName}
          setCatName={setSubName}
          importText={subText}
          setImportText={setSubText}
          importing={subImporting}
          importMsg={subMsg}
          onImport={() => void doImportSubcat()}
          title="添加细分分类"
          buttonLabel="导入到细分分类"
          namePlaceholder="例如：德晨"
        />
      )}
      {!isAll && (
        <YapiImportModal
          open={addToSubcatOpen}
          onClose={() => {
            if (addToSubcatImporting) return;
            setAddToSubcatOpen(false);
            setAddToSubcatId("");
            setAddToSubcatName("");
            setAddToSubcatText("");
            setAddToSubcatMsg(null);
          }}
          catName=""
          setCatName={() => {}}
          importText={addToSubcatText}
          setImportText={setAddToSubcatText}
          importing={addToSubcatImporting}
          importMsg={addToSubcatMsg}
          onImport={() => void doImportToSubcat()}
          title="添加接口"
          buttonLabel="导入到该分类"
          showCatName={false}
          subcatHint={addToSubcatName}
          replaceExisting={addToSubcatReplace}
          onReplaceExistingChange={setAddToSubcatReplace}
        />
      )}
      <YapiExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={exportScope}
        getCachedDetail={getCachedDetail}
      />
    </div>
  );
}
