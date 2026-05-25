import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { parseEnvIndex, updateLinkInEnv } from "@/lib/o5-env-api";
import { cn } from "@/lib/utils";
import type { O5Environment } from "@/types/o5-env";

import { FormDialog } from "./FormDialog";

const inputClassName = cn(
  "w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm",
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-zinc-950",
);

type EditLinkDialogProps = {
  open: boolean;
  kvId: string;
  environment: O5Environment | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function EditLinkDialog({
  open,
  kvId,
  environment,
  onClose,
  onSuccess,
}: EditLinkDialogProps) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [features, setFeatures] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !environment) return;
    setUrl(environment.url);
    setNote(environment.name);
    setFeatures(environment.features ?? "");
    setError(null);
  }, [open, environment]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!environment) return;
    if (!url.trim()) {
      setError("请填写环境 URL");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateLinkInEnv({
        kvId,
        envIndex: parseEnvIndex(environment.id),
        url: url.trim(),
        note: note.trim() || url.trim(),
        features: features.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title="编辑环境链接"
      onClose={handleClose}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={submitting}
          >
            取消
          </Button>
          <Button type="button" size="sm" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? "保存中…" : "保存"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          登录页 URL
          <input
            className={inputClassName}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/sso/login"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          显示名称（note）
          <input
            className={inputClassName}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="测试环境 6173"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          窗口特性（features，可选）
          <input
            className={inputClassName}
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="noopener,noreferrer"
          />
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-[11px] text-muted-foreground">将更新当前系统「{kvId}」中的环境配置。</p>
      </div>
    </FormDialog>
  );
}
