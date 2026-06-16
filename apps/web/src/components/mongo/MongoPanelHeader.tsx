import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MongoPanelHeaderProps = {
  title: string;
  count?: number;
  hint?: string;
  action?: ReactNode;
  className?: string;
};

export function MongoPanelHeader({ title, count, hint, action, className }: MongoPanelHeaderProps) {
  return (
    <div className={cn("border-border/50 shrink-0 border-b", className)}>
      <div className="flex min-h-10 items-center gap-2 px-3 py-2">
        <h2 className="text-muted-foreground/80 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
          <span className="bg-primary/60 size-1.5 shrink-0 rounded-full" aria-hidden />
          <span className="min-w-0 truncate">{title}</span>
          {hint && (
            <span className="text-muted-foreground/60 hidden font-normal normal-case tracking-normal sm:inline">
              {hint}
            </span>
          )}
        </h2>
        {count !== undefined && (
          <Badge
            variant="secondary"
            className="h-5 shrink-0 px-1.5 text-[10px] font-normal tabular-nums"
          >
            {count}
          </Badge>
        )}
        {action && <div className="ml-auto flex min-w-0 items-center gap-1.5">{action}</div>}
      </div>
    </div>
  );
}
