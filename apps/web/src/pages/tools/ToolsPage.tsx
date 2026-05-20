import { useEffect, useRef } from "react";

import { tools } from "@/app/tools/registry";
import { ToolList } from "@/components/tools/ToolList";
import { ToolSection } from "@/components/tools/ToolSection";
import { useActiveToolSection } from "@/hooks/useActiveToolSection";

const toolIds = tools.map((t) => t.id);
const lastToolIndex = tools.length - 1;

export function ToolsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { activeId, registerSection, scrollToTool } = useActiveToolSection({
    toolIds,
    scrollRootRef: scrollRef,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || lastToolIndex < 0) return;

    const syncPaneHeight = () => {
      el.style.setProperty("--tools-pane-height", `${el.clientHeight}px`);
    };

    syncPaneHeight();
    const ro = new ResizeObserver(syncPaneHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-white dark:bg-neutral-950">
      <aside className="border-border/60 bg-[#fcfcfe] dark:bg-neutral-900 flex w-56 shrink-0 flex-col border-r">
        <ToolList tools={tools} activeId={activeId} onSelect={scrollToTool} />
      </aside>

      <div
        ref={scrollRef}
        className="scrollbar-thin bg-[#f8fafc] dark:bg-neutral-950/40 scroll-pt-4 min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 sm:px-5"
      >
        {tools.map((tool, index) => {
          const ToolBody = tool.component;
          return (
            <ToolSection
              key={tool.id}
              id={tool.id}
              title={tool.label}
              description={tool.description}
              icon={tool.icon}
              isFirst={index === 0}
              isLast={index === lastToolIndex}
              titleRef={registerSection(tool.id)}
            >
              <ToolBody />
            </ToolSection>
          );
        })}
      </div>
    </div>
  );
}
