import type { Pm2EcosystemAppPreview } from "@mt-dev/shared";
import { useEffect, useState } from "react";

import { FormDialog } from "@/components/o5-env/FormDialog";
import { Button } from "@/components/ui/button";
import { pm2ParseEcosystem, pm2QuickStart, pm2Save, pm2StartEcosystem } from "@/lib/pm2-api";
import { getPm2AutoSave } from "@/lib/pm2-storage";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm",
  "outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-zinc-950",
);

type StartProcessDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (pmId: number) => void | Promise<void>;
};

type TabId = "quick" | "ecosystem";

type EnvRow = { key: string; value: string };

export function StartProcessDialog({ open, onClose, onSuccess }: StartProcessDialogProps) {
  const [tab, setTab] = useState<TabId>("quick");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [script, setScript] = useState("");
  const [name, setName] = useState("");
  const [cwd, setCwd] = useState("");
  const [args, setArgs] = useState("");
  const [instances, setInstances] = useState("1");
  const [envRows, setEnvRows] = useState<EnvRow[]>([{ key: "", value: "" }]);

  const [ecoContent, setEcoContent] = useState("");
  const [ecoApps, setEcoApps] = useState<Pm2EcosystemAppPreview[]>([]);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setTab("quick");
    setError(null);
    setScript("");
    setName("");
    setCwd("");
    setArgs("");
    setInstances("1");
    setEnvRows([{ key: "", value: "" }]);
    setEcoContent("");
    setEcoApps([]);
    setSelectedApps(new Set());
  }, [open]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const buildEnv = (): Record<string, string> | undefined => {
    const env: Record<string, string> = {};
    for (const row of envRows) {
      const k = row.key.trim();
      if (!k) continue;
      env[k] = row.value;
    }
    return Object.keys(env).length > 0 ? env : undefined;
  };

  const handleQuickSubmit = async () => {
    if (!script.trim() || !name.trim()) {
      setError("脚本路径与进程名必填");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const pmId = await pm2QuickStart({
        script: script.trim(),
        name: name.trim(),
        cwd: cwd.trim() || undefined,
        args: args.trim() ? args.trim().split(/\s+/) : undefined,
        env: buildEnv(),
        instances: Number(instances) || 1,
      });
      if (getPm2AutoSave()) await pm2Save();
      await onSuccess(pmId);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "启动失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleParseEcosystem = async () => {
    if (!ecoContent.trim()) {
      setError("请粘贴或上传 Ecosystem 配置");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await pm2ParseEcosystem(ecoContent);
      setEcoApps(res.apps);
      setSelectedApps(new Set(res.apps.map((a) => a.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEcoSubmit = async () => {
    if (!ecoContent.trim()) {
      setError("请粘贴或上传 Ecosystem 配置");
      return;
    }
    if (selectedApps.size === 0) {
      setError("请至少选择一个 app");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const pmIds = await pm2StartEcosystem({
        content: ecoContent,
        appNames: [...selectedApps],
      });
      if (getPm2AutoSave()) await pm2Save();
      await onSuccess(pmIds[0] ?? 0);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "启动失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (file: File | undefined) => {
    if (!file) return;
    void file.text().then(setEcoContent);
  };

  const toggleApp = (appName: string) => {
    setSelectedApps((prev) => {
      const next = new Set(prev);
      if (next.has(appName)) next.delete(appName);
      else next.add(appName);
      return next;
    });
  };

  return (
    <FormDialog
      open={open}
      title="新增进程"
      onClose={handleClose}
      className="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={handleClose}
          >
            取消
          </Button>
          {tab === "quick" ? (
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={() => void handleQuickSubmit()}
            >
              {submitting ? "启动中…" : "启动"}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={() => void handleEcoSubmit()}
            >
              {submitting ? "启动中…" : "启动选中"}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "quick" ? "bg-white shadow-sm dark:bg-zinc-900" : "text-muted-foreground",
            )}
            onClick={() => setTab("quick")}
          >
            快速启动
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "ecosystem" ? "bg-white shadow-sm dark:bg-zinc-900" : "text-muted-foreground",
            )}
            onClick={() => setTab("ecosystem")}
          >
            Ecosystem
          </button>
        </div>

        {tab === "quick" ? (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              脚本路径 *
              <input
                className={inputClassName}
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="./dist/index.js"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              进程名 *
              <input
                className={inputClassName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-app"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              工作目录
              <input
                className={inputClassName}
                value={cwd}
                onChange={(e) => setCwd(e.target.value)}
                placeholder="/path/to/project"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              参数（空格分隔）
              <input
                className={inputClassName}
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                placeholder="--port 3000"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              实例数
              <input
                className={inputClassName}
                type="number"
                min={1}
                value={instances}
                onChange={(e) => setInstances(e.target.value)}
              />
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">环境变量</span>
              {envRows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={cn(inputClassName, "flex-1")}
                    value={row.key}
                    onChange={(e) => {
                      const next = [...envRows];
                      next[i] = { ...next[i], key: e.target.value };
                      setEnvRows(next);
                    }}
                    placeholder="KEY"
                  />
                  <input
                    className={cn(inputClassName, "flex-1")}
                    value={row.value}
                    onChange={(e) => {
                      const next = [...envRows];
                      next[i] = { ...next[i], value: e.target.value };
                      setEnvRows(next);
                    }}
                    placeholder="value"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => setEnvRows((rows) => [...rows, { key: "", value: "" }])}
              >
                添加变量
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              配置内容
              <textarea
                className={cn(inputClassName, "min-h-[8rem] resize-y font-mono text-xs")}
                value={ecoContent}
                onChange={(e) => setEcoContent(e.target.value)}
                placeholder={'{ "apps": [{ "name": "app", "script": "./index.js" }] }'}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => void handleParseEcosystem()}
              >
                解析
              </Button>
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="file"
                  accept=".js,.cjs,.json,.config.js"
                  className="sr-only"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
                <span className="border-border/60 hover:bg-muted/50 inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium">
                  上传文件
                </span>
              </label>
            </div>
            {ecoApps.length > 0 && (
              <ul className="flex flex-col gap-2 rounded-lg border border-border/50 p-3">
                {ecoApps.map((app) => (
                  <li key={app.name}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedApps.has(app.name)}
                        onChange={() => toggleApp(app.name)}
                      />
                      <span>
                        <span className="font-medium">{app.name}</span>
                        <span className="text-muted-foreground block font-mono text-xs">
                          {app.script}
                        </span>
                        {app.cwd && (
                          <span className="text-muted-foreground block font-mono text-xs">
                            {app.cwd}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </FormDialog>
  );
}
