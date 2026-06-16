import { useCallback, useEffect, useState } from "react";
import { useDefaultLayout } from "react-resizable-panels";

import { Cancel01Icon, Database01Icon, RefreshIcon } from "@hugeicons/core-free-icons";

import { MongoCollectionList } from "@/components/mongo/MongoCollectionList";
import { MongoDocEditor } from "@/components/mongo/MongoDocEditor";
import { MongoDocList } from "@/components/mongo/MongoDocList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  createMongoDoc,
  deleteMongoDoc,
  fetchMongoCollections,
  fetchMongoDoc,
  fetchMongoDocs,
  saveMongoDoc,
} from "@/lib/mongo-api";
import {
  SYSTEMS_COLLECTION,
  collectSystemNames,
  formatDocId,
  isSystemsCollection,
  prepareDocForCopy,
} from "@/lib/mongo-format";

type MongoPageContentProps = {
  databaseName?: string;
  onLock: () => void;
  pagePasswordRequired: boolean;
};

const EMPTY_DOC = "{\n  \n}";

export function MongoPageContent({
  databaseName,
  onLock,
  pagePasswordRequired,
}: MongoPageContentProps) {
  const [collections, setCollections] = useState<{ name: string; count?: number }[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const [docs, setDocs] = useState<Record<string, unknown>[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [editorJson, setEditorJson] = useState(EMPTY_DOC);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const mainLayout = useDefaultLayout({
    id: "mongo-main",
    panelIds: ["collections", "workspace"],
  });

  const workspaceLayout = useDefaultLayout({
    id: "mongo-workspace",
    panelIds: ["docs", "editor"],
  });

  const loadCollections = useCallback(async () => {
    setCollectionsLoading(true);
    setError(null);
    try {
      const res = await fetchMongoCollections();
      setCollections(res.collections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载集合失败");
    } finally {
      setCollectionsLoading(false);
    }
  }, []);

  const loadDocs = useCallback(
    async (collection: string, nextPage: number) => {
      setDocsLoading(true);
      setError(null);
      try {
        const res = await fetchMongoDocs(collection, nextPage, limit);
        setDocs(res.docs);
        setTotal(res.total);
        setPage(res.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载文档失败");
      } finally {
        setDocsLoading(false);
      }
    },
    [limit],
  );

  const loadDoc = useCallback(async (collection: string, id: string) => {
    setEditorLoading(true);
    setError(null);
    try {
      const res = await fetchMongoDoc(collection, id);
      setEditorJson(JSON.stringify(res.doc, null, 2));
      setIsNew(false);
      setSelectedDocId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载文档失败");
    } finally {
      setEditorLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  const handleSelectCollection = useCallback(
    (name: string) => {
      setSelectedCollection(name);
      setSelectedDocId(null);
      setIsNew(false);
      setEditorJson(EMPTY_DOC);
      setPage(1);
      void loadDocs(name, 1);
    },
    [loadDocs],
  );

  useEffect(() => {
    if (collectionsLoading || selectedCollection || collections.length === 0) return;
    const systems = collections.find((c) => c.name === SYSTEMS_COLLECTION);
    if (systems) handleSelectCollection(systems.name);
  }, [collections, collectionsLoading, handleSelectCollection, selectedCollection]);

  const handleSelectDoc = useCallback(
    (id: string) => {
      if (!selectedCollection) return;
      void loadDoc(selectedCollection, id);
    },
    [loadDoc, selectedCollection],
  );

  const loadExistingNames = useCallback(async (collection: string) => {
    const res = await fetchMongoDocs(collection, 1, 500);
    return collectSystemNames(res.docs);
  }, []);

  const handleDuplicateFromList = useCallback(
    async (doc: Record<string, unknown>, sourceId: string) => {
      if (!selectedCollection) return;

      setCopyingId(sourceId);
      setError(null);
      try {
        const existingNames = isSystemsCollection(selectedCollection)
          ? await loadExistingNames(selectedCollection)
          : undefined;

        const copy = prepareDocForCopy(doc, {
          collection: selectedCollection,
          existingNames,
        });

        const res = await createMongoDoc(selectedCollection, copy);
        await loadDocs(selectedCollection, page);
        if (res.doc._id != null) {
          await loadDoc(selectedCollection, formatDocId(res.doc._id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "复制失败");
      } finally {
        setCopyingId(null);
      }
    },
    [loadDoc, loadDocs, loadExistingNames, page, selectedCollection],
  );

  const handleSave = useCallback(
    async (doc: Record<string, unknown>) => {
      if (!selectedCollection) return;
      setSaving(true);
      setError(null);
      try {
        if (isNew) {
          const res = await createMongoDoc(selectedCollection, doc);
          await loadDocs(selectedCollection, page);
          if (res.doc._id != null) {
            await loadDoc(selectedCollection, formatDocId(res.doc._id));
          }
        } else if (selectedDocId) {
          await saveMongoDoc(selectedCollection, selectedDocId, doc);
          await loadDocs(selectedCollection, page);
          await loadDoc(selectedCollection, selectedDocId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "保存失败";
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [isNew, loadDoc, loadDocs, page, selectedCollection, selectedDocId],
  );

  const handleDelete = useCallback(async () => {
    if (!selectedCollection || !selectedDocId) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteMongoDoc(selectedCollection, selectedDocId);
      setSelectedDocId(null);
      setIsNew(false);
      setEditorJson(EMPTY_DOC);
      const nextPage = docs.length <= 1 && page > 1 ? page - 1 : page;
      await loadDocs(selectedCollection, nextPage);
    } catch (err) {
      const message = err instanceof Error ? err.message : "删除失败";
      setError(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, [docs.length, loadDocs, page, selectedCollection, selectedDocId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCollections();
      if (selectedCollection) {
        await loadDocs(selectedCollection, page);
        if (selectedDocId && !isNew) {
          await loadDoc(selectedCollection, selectedDocId);
        }
      }
    } finally {
      setRefreshing(false);
    }
  }, [isNew, loadCollections, loadDoc, loadDocs, page, selectedCollection, selectedDocId]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-neutral-950">
      <header className="border-border/50 flex shrink-0 items-center gap-3 border-b px-4 py-2.5">
        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Icon icon={Database01Icon} className="size-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-sm font-semibold">Mongo 数据编辑</h1>
            {databaseName && (
              <Badge variant="outline" className="h-5 font-mono text-[10px] font-normal">
                {databaseName}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-xs">浏览集合、编辑 JSON 文档</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            disabled={refreshing}
            onClick={() => void handleRefresh()}
          >
            <Icon icon={RefreshIcon} className={cnIcon(refreshing)} strokeWidth={1.75} />
            刷新
          </Button>
          {pagePasswordRequired && (
            <Button type="button" variant="ghost" size="sm" className="h-8" onClick={onLock}>
              锁定
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div
          className="bg-destructive/10 text-destructive flex shrink-0 items-start gap-2 border-b px-4 py-2 text-sm"
          role="alert"
        >
          <span className="min-w-0 flex-1 leading-relaxed">{error}</span>
          <button
            type="button"
            aria-label="关闭错误提示"
            onClick={() => setError(null)}
            className="hover:bg-destructive/10 shrink-0 rounded p-1 transition-colors"
          >
            <Icon icon={Cancel01Icon} className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
      )}

      <ResizablePanelGroup
        id="mongo-main"
        className="min-h-0 flex-1"
        defaultLayout={mainLayout.defaultLayout}
        onLayoutChanged={mainLayout.onLayoutChanged}
      >
        <ResizablePanel
          id="collections"
          defaultSize="18%"
          minSize="14%"
          maxSize="28%"
          className="border-border/60 flex min-h-0 flex-col overflow-hidden border-r bg-[#fcfcfe] dark:bg-neutral-900"
        >
          <MongoCollectionList
            collections={collections}
            selected={selectedCollection}
            loading={collectionsLoading}
            onSelect={handleSelectCollection}
          />
        </ResizablePanel>

        <ResizableHandle withHandle variant="vertical" className="bg-border shrink-0" />

        <ResizablePanel
          id="workspace"
          minSize="55%"
          className="flex h-full min-h-0 min-w-0 flex-col"
        >
          <ResizablePanelGroup
            id="mongo-workspace"
            className="min-h-0 flex-1"
            defaultLayout={workspaceLayout.defaultLayout}
            onLayoutChanged={workspaceLayout.onLayoutChanged}
          >
            <ResizablePanel
              id="docs"
              defaultSize="34%"
              minSize="24%"
              maxSize="48%"
              className="border-border/60 flex min-h-0 min-w-0 flex-col overflow-hidden border-r bg-white dark:bg-neutral-950"
            >
              <MongoDocList
                collection={selectedCollection}
                docs={docs}
                selectedId={selectedDocId}
                loading={docsLoading}
                copyingId={copyingId}
                page={page}
                total={total}
                limit={limit}
                onSelect={handleSelectDoc}
                onCopy={
                  isSystemsCollection(selectedCollection) ? handleDuplicateFromList : undefined
                }
                onPageChange={(p) => {
                  if (selectedCollection) void loadDocs(selectedCollection, p);
                }}
              />
            </ResizablePanel>

            <ResizableHandle withHandle variant="vertical" className="bg-border shrink-0" />

            <ResizablePanel
              id="editor"
              minSize="38%"
              className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#f8fafc] dark:bg-neutral-950/40"
            >
              <MongoDocEditor
                key={`${selectedCollection ?? ""}:${selectedDocId ?? "new"}:${isNew}`}
                collection={selectedCollection}
                docId={selectedDocId}
                isNew={isNew}
                loading={editorLoading}
                saving={saving}
                deleting={deleting}
                initialJson={editorJson}
                onSave={handleSave}
                onDelete={!isNew && selectedDocId ? handleDelete : undefined}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function cnIcon(spinning: boolean) {
  return spinning ? "size-3.5 animate-spin" : "size-3.5";
}
