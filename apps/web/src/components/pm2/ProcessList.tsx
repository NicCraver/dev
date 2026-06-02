import type { Pm2ProcessSummary } from "@mt-dev/shared";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProcessListProps = {
  processes: Pm2ProcessSummary[];
  selectedPmId: number | null;
  onSelect: (pmId: number) => void;
};

function formatMemory(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusBadgeVariant(status: string): "success" | "secondary" | "destructive" | "outline" {
  if (status === "online") return "success";
  if (status === "stopped") return "secondary";
  if (status === "errored") return "destructive";
  return "outline";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    online: "运行中",
    stopped: "已停止",
    stopping: "停止中",
    launching: "启动中",
    errored: "错误",
  };
  return labels[status] ?? status;
}

export function ProcessList({ processes, selectedPmId, onSelect }: ProcessListProps) {
  return (
    <aside className="border-border/50 flex min-h-0 flex-col border-r bg-transparent">
      <h2 className="text-muted-foreground/75 shrink-0 px-4 pt-3 pb-1.5 text-[10px] font-bold tracking-widest uppercase">
        进程列表
      </h2>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 pb-2">
        {processes.length === 0 ? (
          <p className="text-muted-foreground/55 px-2 py-8 text-center text-xs italic">
            暂无进程，点击新增进程
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {processes.map((proc) => {
              const selected = proc.pmId === selectedPmId;
              return (
                <li key={proc.pmId}>
                  <button
                    type="button"
                    onClick={() => onSelect(proc.pmId)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                      "hover:bg-muted/50",
                      selected
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 bg-transparent",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {proc.name}
                      </span>
                      <Badge
                        variant={statusBadgeVariant(proc.status)}
                        className="shrink-0 text-[10px]"
                      >
                        {statusLabel(proc.status)}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-1 flex gap-3 text-[11px] tabular-nums">
                      <span>CPU {proc.cpu.toFixed(1)}%</span>
                      <span>{formatMemory(proc.memory)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
