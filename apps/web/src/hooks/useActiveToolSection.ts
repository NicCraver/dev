import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { scrollElementToTopSmooth, TOOL_SECTION_SCROLL_PADDING } from "@/lib/scroll-container";

type UseActiveToolSectionOptions = {
  toolIds: string[];
  scrollRootRef: RefObject<HTMLDivElement | null>;
  rootMargin?: string;
};

export function useActiveToolSection({
  toolIds,
  scrollRootRef,
  rootMargin = "-5% 0px -75% 0px",
}: UseActiveToolSectionOptions) {
  const [activeId, setActiveId] = useState(toolIds[0] ?? "");
  const anchorRefs = useRef(new Map<string, HTMLElement>());
  const scrollingToRef = useRef<string | null>(null);

  const registerSection = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) anchorRefs.current.set(id, el);
      else anchorRefs.current.delete(id);
    },
    [],
  );

  const scrollToTool = useCallback(
    (id: string) => {
      const root = scrollRootRef.current;
      const anchor = anchorRefs.current.get(id);
      if (!root || !anchor) return;

      scrollingToRef.current = id;
      setActiveId(id);

      requestAnimationFrame(() => {
        scrollElementToTopSmooth(root, anchor, TOOL_SECTION_SCROLL_PADDING);
        window.setTimeout(() => {
          if (scrollingToRef.current === id) scrollingToRef.current = null;
        }, 900);
      });
    },
    [scrollRootRef],
  );

  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root || toolIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingToRef.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const topmost = visible[0];
        if (!topmost?.target.id.startsWith("tool-")) return;

        const matchedId = topmost.target.id.replace(/^tool-/, "");
        if (toolIds.includes(matchedId)) setActiveId(matchedId);
      },
      { root, rootMargin, threshold: [0, 1] },
    );

    for (const id of toolIds) {
      const el = anchorRefs.current.get(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [scrollRootRef, toolIds, rootMargin]);

  useEffect(() => {
    if (toolIds.length > 0 && !toolIds.includes(activeId)) {
      setActiveId(toolIds[0]);
    }
  }, [toolIds, activeId]);

  return { activeId, registerSection, scrollToTool };
}
