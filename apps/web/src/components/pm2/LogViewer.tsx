import { useEffect, useRef, useState } from "react";

import { fetchPm2Logs, subscribePm2Logs } from "@/lib/pm2-api";
import { cn } from "@/lib/utils";

type LogViewerProps = {
  pmId: number | null;
};

export function LogViewer({ pmId }: LogViewerProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    if (pmId == null) {
      setLines([]);
      setStreamError(null);
      return;
    }

    let cancelled = false;
    stickToBottomRef.current = true;
    setLines([]);
    setStreamError(null);

    void fetchPm2Logs(pmId)
      .then((history) => {
        if (!cancelled) setLines(history);
      })
      .catch((err) => {
        if (!cancelled) {
          setStreamError(err instanceof Error ? err.message : "加载日志失败");
        }
      });

    const unsubscribe = subscribePm2Logs(
      pmId,
      (line) => {
        if (cancelled) return;
        setLines((prev) => [...prev, line]);
      },
      (err) => {
        if (!cancelled) setStreamError(err.message);
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [pmId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 48;
  };

  return (
    <section className="flex min-h-0 flex-col">
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
        日志
      </h3>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          "max-h-96 min-h-[12rem] overflow-y-auto rounded-lg border border-border/50 bg-zinc-950 p-3",
          "font-mono text-xs text-zinc-100",
        )}
      >
        {pmId == null ? (
          <p className="text-zinc-500">选择进程后查看日志</p>
        ) : lines.length === 0 ? (
          <p className="text-zinc-500">暂无日志输出</p>
        ) : (
          lines.map((line, i) => (
            <div key={`${i}-${line.slice(0, 32)}`} className="whitespace-pre-wrap break-all">
              {line}
            </div>
          ))
        )}
      </div>
      {streamError && <p className="text-destructive mt-2 text-xs">{streamError}</p>}
    </section>
  );
}
