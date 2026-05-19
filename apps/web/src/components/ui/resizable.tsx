import { GripHorizontal, GripVertical } from "lucide-react";
import type { ComponentProps } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  orientation = "horizontal",
  ...props
}: ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot="resizable-panel-group"
      className={cn("flex h-full w-full", orientation === "vertical" && "flex-col", className)}
      orientation={orientation}
      {...props}
    />
  );
}

function ResizablePanel({ className, ...props }: ComponentProps<typeof Panel>) {
  return (
    <Panel data-slot="resizable-panel" className={cn("min-h-0 min-w-0", className)} {...props} />
  );
}

type ResizableHandleProps = ComponentProps<typeof Separator> & {
  withHandle?: boolean;
  /** 分隔线走向：vertical = 左右分栏之间的竖线；horizontal = 上下分栏之间的横线 */
  variant?: "vertical" | "horizontal";
};

function ResizableHandle({
  className,
  withHandle = false,
  variant = "vertical",
  ...props
}: ResizableHandleProps) {
  const isVertical = variant === "vertical";

  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border relative z-10 shrink-0 outline-none focus:outline-none focus-visible:outline-none",
        isVertical ? "w-px" : "h-px w-full",
        withHandle && "flex items-center justify-center",
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <div
          className={cn(
            "bg-background border-border pointer-events-none z-20 flex items-center justify-center rounded-sm border shadow-sm",
            isVertical ? "h-6 w-4" : "h-4 w-6",
          )}
          aria-hidden
        >
          {isVertical ? (
            <GripVertical className="text-muted-foreground size-2.5" />
          ) : (
            <GripHorizontal className="text-muted-foreground size-2.5" />
          )}
        </div>
      ) : null}
    </Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
