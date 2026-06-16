import { useCallback, useState } from "react";

import { FloppyDiskIcon } from "@hugeicons/core-free-icons";

import { MongoDeleteConfirmDialog } from "@/components/mongo/MongoDeleteConfirmDialog";
import { MongoEmptyState } from "@/components/mongo/MongoEmptyState";
import { MongoPanelHeader } from "@/components/mongo/MongoPanelHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { isSystemsCollection } from "@/lib/mongo-format";
import { cn } from "@/lib/utils";

type MongoDocEditorProps = {
  collection: string | null;
  docId: string | null;
  isNew: boolean;
  loading: boolean;
  saving: boolean;
  deleting?: boolean;
  initialJson: string;
  onSave: (doc: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
};

const textareaClassName = cn(
  "min-h-0 w-full flex-1 resize-none border-0 bg-transparent p-4 font-mono text-xs leading-relaxed",
  "text-foreground placeholder:text-muted-foreground/50 focus:outline-none",
);

type StatusType = "idle" | "ok" | "err";

export function MongoDocEditor({
  collection,
  docId,
  isNew,
  loading,
  saving,
  deleting = false,
  initialJson,
  onSave,
  onDelete,
}: MongoDocEditorProps) {
  const [text, setText] = useState(initialJson);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [status, setStatus] = useState<{ type: StatusType; message: string }>({
    type: "idle",
    message: "就绪",
  });

  const setError = (message: string) => setStatus({ type: "err", message });
  const setOk = (message: string) => setStatus({ type: "ok", message });

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(text) as unknown;
      setText(JSON.stringify(parsed, null, 2));
      setOk("已格式化");
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON 无效");
    }
  }, [text]);

  const handleSave = useCallback(async () => {
    if (!collection) return;
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setError("文档须为 JSON 对象");
        return;
      }
      await onSave(parsed as Record<string, unknown>);
      setOk(isNew ? "插入成功" : "保存成功");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    }
  }, [collection, isNew, onSave, text]);

  const deleteTarget = (() => {
    if (!docId) return null;

    let label = docId;
    if (isSystemsCollection(collection)) {
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        if (typeof parsed.name === "string" && parsed.name) {
          label = parsed.name;
        }
      } catch {
        // use docId
      }
    }

    return {
      label,
      noun: isSystemsCollection(collection) ? "系统" : "文档",
    };
  })();

  const handleDeleteClick = useCallback(() => {
    if (!onDelete || !docId) return;
    setDeleteDialogOpen(true);
  }, [docId, onDelete]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!onDelete) return;

    try {
      await onDelete();
      setDeleteDialogOpen(false);
      setOk("删除成功");
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }, [onDelete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        handleFormat();
      }
    },
    [handleFormat, handleSave],
  );

  const headerAction =
    collection != null ? (
      <Badge variant="secondary" className="h-5 font-mono text-[10px] font-normal">
        {collection}
      </Badge>
    ) : null;

  if (!collection) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MongoPanelHeader title="JSON 编辑器" />
        <MongoEmptyState
          icon={FloppyDiskIcon}
          title="选择集合后开始编辑"
          description="在左侧选择集合，再选中文档"
        />
      </div>
    );
  }

  if (!isNew && !docId && !loading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <MongoPanelHeader title="JSON 编辑器" action={headerAction} />
        <MongoEmptyState
          icon={FloppyDiskIcon}
          title={isSystemsCollection(collection) ? "选择一个系统" : "选择一条文档"}
          description={
            isSystemsCollection(collection)
              ? "在文档列表中点击系统查看详情，或点复制图标直接新建副本"
              : "在文档列表中选择文档"
          }
        />
      </div>
    );
  }

  const modeLabel = isNew
    ? isSystemsCollection(collection)
      ? "新建系统"
      : "新建文档"
    : docId
      ? `_id: ${docId}`
      : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <MongoPanelHeader title="JSON 编辑器" action={headerAction} />

      <div className="border-border/50 flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleFormat}
            disabled={!text}
          >
            格式化
          </Button>
        </div>

        <span className="bg-border/70 hidden h-4 w-px sm:block" aria-hidden />

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            className="h-7 gap-1 px-2.5 text-xs"
            onClick={() => void handleSave()}
            disabled={saving || deleting || loading}
          >
            <Icon icon={FloppyDiskIcon} className="size-3.5" strokeWidth={1.75} />
            {saving ? "保存中…" : isNew ? "插入" : "保存"}
          </Button>
          {!isNew && docId && onDelete && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 h-7 px-2.5 text-xs"
              onClick={handleDeleteClick}
              disabled={saving || deleting || loading}
            >
              {deleting ? "删除中…" : "删除"}
            </Button>
          )}
        </div>

        <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
          {modeLabel && (
            <span className="text-muted-foreground max-w-[min(240px,40vw)] truncate font-mono text-[11px]">
              {modeLabel}
            </span>
          )}
          <Badge
            variant={
              status.type === "ok" ? "success" : status.type === "err" ? "destructive" : "outline"
            }
            className="h-6 px-2 text-[11px] font-normal"
          >
            {status.message}
          </Badge>
        </div>
      </div>

      <div className="bg-background/60 flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center p-6">
            <div className="bg-muted/60 h-full min-h-0 w-full max-w-lg animate-pulse rounded-md" />
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (status.type !== "idle") setStatus({ type: "idle", message: "已修改" });
            }}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            aria-label="JSON 文档编辑器"
            className={textareaClassName}
            placeholder='{ "name": "示例" }'
          />
        )}
      </div>

      <p className="text-muted-foreground shrink-0 border-t px-3 py-1.5 text-[11px] leading-relaxed">
        <kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">⌘</kbd>
        {" + "}
        <kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">S</kbd>
        {" 保存 · "}
        <kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">⌘</kbd>
        {" + "}
        <kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">⇧</kbd>
        {" + "}
        <kbd className="bg-muted rounded border px-1 py-0.5 font-mono text-[10px]">F</kbd>
        {" 格式化"}
      </p>

      {deleteTarget && (
        <MongoDeleteConfirmDialog
          open={deleteDialogOpen}
          noun={deleteTarget.noun}
          label={deleteTarget.label}
          collection={collection}
          deleting={deleting}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => void handleDeleteConfirm()}
        />
      )}
    </div>
  );
}
