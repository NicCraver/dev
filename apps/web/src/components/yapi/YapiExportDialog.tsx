import { useEffect, useRef, useState } from "react";

import { FormDialog } from "@/components/o5-env/FormDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  downloadBlob,
  exportCollectionsToZip,
  exportZipFilename,
  type ExportProgress,
  type ExportScope,
} from "@/lib/yapi-export";
import type { IfaceItem } from "@/lib/yapi-types";

type YapiExportDialogProps = {
  open: boolean;
  onClose: () => void;
  scope: ExportScope | null;
  getCachedDetail?: (id: string) => IfaceItem | undefined;
};

export function YapiExportDialog({ open, onClose, scope, getCachedDetail }: YapiExportDialogProps) {
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      setProgress(null);
      setError("");
      setRunning(false);
      return;
    }
    if (!scope || startedRef.current) return;
    startedRef.current = true;
    setRunning(true);
    setError("");

    void exportCollectionsToZip(scope, setProgress, getCachedDetail)
      .then((blob) => {
        downloadBlob(blob, exportZipFilename(scope));
        setRunning(false);
        onClose();
      })
      .catch((err) => {
        setError(String((err as Error).message || err));
        setRunning(false);
      });
  }, [open, scope, getCachedDetail, onClose]);

  const pct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

  return (
    <FormDialog
      open={open}
      title="导出接口文档"
      onClose={running ? () => {} : onClose}
      className="max-w-md"
      footer={
        !running ? (
          <Button type="button" variant="outline" onClick={onClose}>
            {error ? "关闭" : "取消"}
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-xs">
          将当前范围内的接口导出为 Markdown，并按分类目录打包为 ZIP 下载。
        </p>

        {running ? (
          <div className="space-y-2">
            <div className="text-sm text-slate-800">{progress?.label || "准备中…"}</div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            {progress ? (
              <div className="text-muted-foreground text-xs tabular-nums">
                {progress.phase === "sync" && "同步 YApi 详情"}
                {progress.phase === "generate" && "生成 Markdown"}
                {progress.phase === "zip" && "打包 ZIP"}
                {progress.total > 0 ? ` · ${progress.current}/${progress.total}` : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className={cn("bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-xs")}>
            {error}
          </div>
        ) : null}
      </div>
    </FormDialog>
  );
}
