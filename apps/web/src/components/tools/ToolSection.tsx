import type { ReactNode } from "react";

import type { IconSvgElement } from "@/components/ui/icon";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ToolSectionProps = {
  id: string;
  title: string;
  description: ReactNode;
  icon: IconSvgElement;
  children: ReactNode;
  isFirst?: boolean;
  /** 最后一项：补足视口高度 + 底部留白，便于标题滚到顶 */
  isLast?: boolean;
  /** 挂在卡片上，用于滚动定位与目录高亮 */
  titleRef?: (el: HTMLElement | null) => void;
};

export function ToolSection({
  id,
  title,
  description,
  icon,
  children,
  isFirst = false,
  isLast = false,
  titleRef,
}: ToolSectionProps) {
  return (
    <section
      className={cn(
        "mx-auto w-full max-w-5xl",
        isFirst ? "pt-8" : "pt-2",
        isLast ? "min-h-[var(--tools-pane-height,100%)] pb-[min(60vh,32rem)]" : "pb-5",
      )}
      aria-labelledby={`tool-${id}-title`}
    >
      <article
        id={`tool-${id}`}
        ref={titleRef}
        className="border-border/70 bg-card scroll-mt-4 overflow-hidden rounded-xl border shadow-sm"
      >
        <header className="border-border/60 bg-muted/25 border-b px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3.5">
            <span className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Icon icon={icon} className="size-[18px]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={`tool-${id}-title`} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{description}</p>
            </div>
          </div>
        </header>
        <div className="p-5 sm:p-6">{children}</div>
      </article>
    </section>
  );
}
