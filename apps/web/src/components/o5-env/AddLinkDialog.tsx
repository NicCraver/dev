import { useState } from "react";

import { Button } from "@/components/ui/button";
import { addLinkToEnv } from "@/lib/o5-env-api";
import { cn } from "@/lib/utils";

import { FormDialog } from "./FormDialog";

const inputClassName = cn(
  "w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm",
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-zinc-950",
);

type AddLinkDialogProps = {
  open: boolean;
  kvId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddLinkDialog({ open, kvId, onClose, onSuccess }: AddLinkDialogProps) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setUrl("");
    setNote("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError("请填写环境 URL");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addLinkToEnv({
        kvId,
        url: url.trim(),
        note: note.trim() || url.trim(),
      });
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title="添加环境链接"
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
            {submitting ? "提交中…" : "添加"}
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
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-[11px] text-muted-foreground">将写入当前系统「{kvId}」的环境列表。</p>
      </div>
    </FormDialog>
  );
}
