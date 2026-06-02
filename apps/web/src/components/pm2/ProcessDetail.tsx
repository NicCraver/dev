import { useState } from "react";

import type { Pm2ProcessDetail } from "@mt-dev/shared";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProcessDetailProps = {
  detail: Pm2ProcessDetail | null;
  acting: boolean;
  onAction: (action: "restart" | "stop" | "start") => void;
};

function formatMemory(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUptime(ms: number): string {
  if (ms <= 0) return "—";
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day} 天 ${hr % 24} 小时`;
  if (hr > 0) return `${hr} 小时 ${min % 60} 分`;
  if (min > 0) return `${min} 分 ${sec % 60} 秒`;
  return `${sec} 秒`;
}

function isApiProcess(name: string): boolean {
  return name.includes("mt-dev-api");
}

function confirmAction(action: "restart" | "stop", name: string): boolean {
  const apiWarning = isApiProcess(name) ? "将重启 Dev Dash API，页面可能短暂断开。\n\n" : "";

  if (action === "stop") {
    return window.confirm(`${apiWarning}确定要停止进程「${name}」吗？`);
  }

  if (action === "restart" && isApiProcess(name)) {
    return window.confirm(`${apiWarning}确定要重启进程「${name}」吗？`);
  }

  return true;
}

export function ProcessDetail({ detail, acting, onAction }: ProcessDetailProps) {
  const [envExpanded, setEnvExpanded] = useState(false);

  if (!detail) {
    return (
      <div className="text-muted-foreground rounded-lg border border-border/50 p-6 text-sm">
        请从左侧选择一个进程
      </div>
    );
  }

  const stopped = detail.status === "stopped";

  const handleAction = (action: "restart" | "stop" | "start") => {
    if (action === "stop" || action === "restart") {
      if (!confirmAction(action, detail.name)) return;
    }
    onAction(action);
  };

  return (
    <section className="rounded-lg border border-border/50 bg-white/50 p-4 dark:bg-zinc-950/30">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">{detail.name}</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">PM ID {detail.pmId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={acting} onClick={() => handleAction("restart")}>
            重启
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            disabled={acting}
            onClick={() => handleAction("stop")}
          >
            停止
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={acting || !stopped}
            onClick={() => handleAction("start")}
          >
            启动
          </Button>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground text-xs">状态</dt>
          <dd className="mt-0.5">
            <Badge variant={detail.status === "online" ? "success" : "outline"}>
              {detail.status}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">CPU</dt>
          <dd className="mt-0.5 tabular-nums">{detail.cpu.toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">内存</dt>
          <dd className="mt-0.5 tabular-nums">{formatMemory(detail.memory)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">运行时长</dt>
          <dd className="mt-0.5">{formatUptime(detail.uptime)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">PID</dt>
          <dd className="mt-0.5 tabular-nums">{detail.pid || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">重启次数</dt>
          <dd className="mt-0.5 tabular-nums">{detail.restartTime}</dd>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <dt className="text-muted-foreground text-xs">脚本</dt>
          <dd className="mt-0.5 break-all font-mono text-xs">{detail.script || "—"}</dd>
        </div>
        {detail.cwd && (
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-muted-foreground text-xs">工作目录</dt>
            <dd className="mt-0.5 break-all font-mono text-xs">{detail.cwd}</dd>
          </div>
        )}
        {detail.args && detail.args.length > 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-muted-foreground text-xs">参数</dt>
            <dd className="mt-0.5 break-all font-mono text-xs">{detail.args.join(" ")}</dd>
          </div>
        )}
        {detail.execMode && (
          <div>
            <dt className="text-muted-foreground text-xs">执行模式</dt>
            <dd className="mt-0.5">{detail.execMode}</dd>
          </div>
        )}
        {detail.instances != null && (
          <div>
            <dt className="text-muted-foreground text-xs">实例数</dt>
            <dd className="mt-0.5 tabular-nums">{detail.instances}</dd>
          </div>
        )}
      </dl>

      {detail.env && Object.keys(detail.env).length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-xs font-medium"
            onClick={() => setEnvExpanded((v) => !v)}
          >
            环境变量 {envExpanded ? "▲" : "▼"}
          </button>
          {envExpanded && (
            <pre
              className={cn(
                "mt-2 max-h-48 overflow-auto rounded-lg border border-border/50 bg-muted/30 p-3",
                "font-mono text-xs",
              )}
            >
              {JSON.stringify(detail.env, null, 2)}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
