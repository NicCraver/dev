import { useEffect, useState } from "react";

import { FormDialog } from "@/components/o5-env/FormDialog";
import { Button } from "@/components/ui/button";
import {
  getPm2AutoSave,
  getPm2RefreshMs,
  getPm2Token,
  setPm2AutoSave,
  setPm2RefreshMs,
  setPm2Token,
} from "@/lib/pm2-storage";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm",
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-zinc-950",
);

const REFRESH_OPTIONS = [
  { label: "关闭", value: 0 },
  { label: "3 秒", value: 3000 },
  { label: "5 秒", value: 5000 },
  { label: "10 秒", value: 10000 },
] as const;

type Pm2SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function Pm2SettingsDialog({ open, onClose, onSaved }: Pm2SettingsDialogProps) {
  const [token, setToken] = useState("");
  const [autoSave, setAutoSave] = useState(false);
  const [refreshMs, setRefreshMs] = useState(5000);

  useEffect(() => {
    if (!open) return;
    setToken(getPm2Token());
    setAutoSave(getPm2AutoSave());
    setRefreshMs(getPm2RefreshMs());
  }, [open]);

  const handleSave = () => {
    setPm2Token(token.trim());
    setPm2AutoSave(autoSave);
    setPm2RefreshMs(refreshMs);
    onSaved?.();
    onClose();
  };

  return (
    <FormDialog
      open={open}
      title="PM2 设置"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            保存
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          API Token
          <input
            type="password"
            className={inputClassName}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="与 PM2_API_TOKEN 一致"
            autoComplete="off"
          />
          <span className="text-muted-foreground font-normal">
            生产环境需配置 Token，请求将自动携带 Bearer 头
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
          <span>操作后自动执行 pm2 save</span>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          列表自动刷新
          <select
            className={inputClassName}
            value={refreshMs}
            onChange={(e) => setRefreshMs(Number(e.target.value))}
          >
            {REFRESH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </FormDialog>
  );
}
