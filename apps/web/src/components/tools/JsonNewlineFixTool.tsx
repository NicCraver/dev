import { useCallback, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { repairJson } from "@/lib/json-repair";
import { cn } from "@/lib/utils";

type StatusType = "idle" | "ok" | "err";

export function JsonNewlineFixTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [fixTime, setFixTime] = useState(true);
  const [prettify, setPrettify] = useState(true);
  const [status, setStatus] = useState<{ type: StatusType; message: string }>({
    type: "idle",
    message: "就绪",
  });

  const handleFix = useCallback(() => {
    const raw = input;
    if (!raw.trim()) {
      setStatus({ type: "err", message: "请输入 JSON 内容" });
      return;
    }

    try {
      const result = repairJson(raw, { fixTime, prettify });
      setOutput(result);
      setStatus({ type: "ok", message: "修复成功，JSON 合法" });
    } catch (e) {
      setOutput("");
      const message = e instanceof Error ? e.message : String(e);
      setStatus({ type: "err", message: `仍无法解析：${message}` });
    }
  }, [input, fixTime, prettify]);

  const handleClear = () => {
    setInput("");
    setOutput("");
    setStatus({ type: "idle", message: "已清空" });
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setStatus({ type: "ok", message: "已复制到剪贴板" });
    } catch {
      setStatus({ type: "ok", message: "已复制到剪贴板" });
    }
  };

  const canCopy = output.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <JsonPanel label="输入">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleFix();
              }
            }}
            placeholder="粘贴损坏的 JSON…"
            spellCheck={false}
            className={textareaClassName}
          />
        </JsonPanel>
        <JsonPanel
          label="输出"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              disabled={!canCopy}
              onClick={() => void handleCopy()}
            >
              复制
            </Button>
          }
        >
          <textarea
            value={output}
            readOnly
            placeholder="修复结果将显示在这里…"
            spellCheck={false}
            className={textareaClassName}
          />
        </JsonPanel>
      </div>

      <div className="border-border/60 bg-muted/25 flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-lg border px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={handleFix}>
            修复
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            清空
          </Button>
        </div>

        <span className="bg-border/80 hidden h-5 w-px sm:block" aria-hidden />

        <div className="flex flex-wrap items-center gap-3">
          <OptionToggle checked={fixTime} onChange={setFixTime} label="修复时间格式空格" />
          <OptionToggle checked={prettify} onChange={setPrettify} label="输出格式化" />
        </div>

        <span
          className={cn(
            "ml-auto inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
            status.type === "ok" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            status.type === "err" && "bg-destructive/10 text-destructive",
            status.type === "idle" && "bg-muted text-muted-foreground",
          )}
        >
          {status.message}
        </span>
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        快捷键 <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">⌘</kbd>{" "}
        + <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>{" "}
        执行修复
      </p>
    </div>
  );
}

function OptionToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="text-muted-foreground inline-flex cursor-pointer items-center gap-1.5 text-sm select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary size-3.5 rounded"
      />
      {label}
    </label>
  );
}

function JsonPanel({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-muted/30 ring-border/60 flex min-h-[360px] flex-col overflow-hidden rounded-lg ring-1">
      <div className="border-border/50 text-muted-foreground flex items-center justify-between border-b px-3.5 py-2 text-xs font-semibold tracking-wider uppercase">
        <span>{label}</span>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

const textareaClassName =
  "min-h-[300px] flex-1 w-full resize-y border-0 bg-transparent p-3.5 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none";
