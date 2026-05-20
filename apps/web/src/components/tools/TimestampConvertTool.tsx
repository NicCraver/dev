import { Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { DEFAULT_TIMEZONE, formatTimezoneOption } from "@/lib/timezones";
import {
  formatRelative,
  formatTimestampMs,
  formatUtcIso,
  parseTimestampInput,
} from "@/lib/timestamp-parse";
import { cn } from "@/lib/utils";

import { TimezonePicker } from "./TimezonePicker";

type TimestampRow = {
  id: string;
  input: string;
};

function createRow(input = ""): TimestampRow {
  return { id: crypto.randomUUID(), input };
}

const INITIAL_ROWS: TimestampRow[] = [
  createRow(String(Math.floor(Date.now() / 1000))),
  createRow(),
];

export function TimestampConvertTool() {
  const [timeZone, setTimeZone] = useState(DEFAULT_TIMEZONE);
  const [rows, setRows] = useState<TimestampRow[]>(INITIAL_ROWS);
  const [nowMs] = useState(() => Date.now());

  const parsedRows = useMemo(
    () =>
      rows.map((row) => {
        const parsed = parseTimestampInput(row.input);
        if (!parsed.ok) {
          return { ...row, parsed, seconds: null, formatted: null, utc: null, relative: null };
        }
        return {
          ...row,
          parsed,
          seconds: Math.floor(parsed.ms / 1000),
          formatted: formatTimestampMs(parsed.ms, timeZone),
          utc: formatUtcIso(parsed.ms),
          relative: formatRelative(parsed.ms, nowMs),
        };
      }),
    [rows, timeZone, nowMs],
  );

  const updateRow = (id: string, input: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, input } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, createRow()]);
  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };
  const clearRows = () => setRows([createRow()]);

  const fillNow = () => {
    const now = String(Math.floor(Date.now() / 1000));
    setRows((prev) => {
      const empty = prev.find((r) => !r.input.trim());
      if (empty) {
        return prev.map((r) => (r.id === empty.id ? { ...r, input: now } : r));
      }
      return [...prev, createRow(now)];
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-border/60 bg-muted/25 flex flex-wrap items-end gap-4 rounded-lg border px-3.5 py-3">
        <div className="min-w-[min(100%,18rem)] flex-1 space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            时区
          </label>
          <TimezonePicker value={timeZone} onChange={setTimeZone} />
        </div>
        <p className="text-muted-foreground inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs ring-1 ring-border/60">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
          当前显示：{formatTimezoneOption(timeZone)}
        </p>
      </div>

      <div className="ring-border/60 overflow-hidden rounded-lg ring-1">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-border/60 bg-muted/40 border-b text-left">
                <th className="text-muted-foreground w-10 px-3 py-2.5 text-xs font-semibold">#</th>
                <th className="text-muted-foreground min-w-[12rem] px-3 py-2.5 text-xs font-semibold">
                  时间戳 / 日期
                </th>
                <th className="text-muted-foreground w-28 px-3 py-2.5 text-xs font-semibold tabular-nums">
                  秒
                </th>
                <th className="text-muted-foreground w-32 px-3 py-2.5 text-xs font-semibold tabular-nums">
                  毫秒
                </th>
                <th className="text-muted-foreground min-w-[11rem] px-3 py-2.5 text-xs font-semibold">
                  本地时间
                </th>
                <th className="text-muted-foreground min-w-[12rem] px-3 py-2.5 text-xs font-semibold">
                  UTC
                </th>
                <th className="text-muted-foreground w-24 px-3 py-2.5 text-xs font-semibold">
                  相对
                </th>
                <th className="w-10 px-2 py-2.5" aria-label="操作" />
              </tr>
            </thead>
            <tbody className="bg-background/60">
              {parsedRows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-border/50 border-b last:border-b-0",
                    index % 2 === 1 && "bg-muted/15",
                  )}
                >
                  <td className="text-muted-foreground px-3 py-2 tabular-nums">{index + 1}</td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={row.input}
                      onChange={(e) => updateRow(row.id, e.target.value)}
                      placeholder="Unix 秒/毫秒或 ISO 日期"
                      spellCheck={false}
                      className="border-input bg-background focus-visible:ring-ring/50 w-full rounded-md border px-2.5 py-1.5 font-mono text-xs outline-none focus-visible:ring-[3px]"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs tabular-nums">
                    {row.parsed.ok ? row.seconds : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs tabular-nums">
                    {row.parsed.ok ? row.parsed.ms : "—"}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-xs tabular-nums",
                      row.parsed.ok ? "text-foreground" : "text-destructive",
                    )}
                  >
                    {row.parsed.ok ? row.formatted : row.parsed.error}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                    {row.utc ?? "—"}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-xs">{row.relative ?? "—"}</td>
                  <td className="px-2 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(row.id)}
                      aria-label="删除此行"
                    >
                      <Icon icon={Cancel01Icon} className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={addRow}>
          <Icon icon={Add01Icon} className="size-4" />
          添加一行
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={fillNow}>
          填入当前时间
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearRows}>
          清空
        </Button>
      </div>

      <p className="text-muted-foreground rounded-lg bg-muted/20 px-3 py-2.5 text-xs leading-relaxed">
        支持 Unix 秒（10 位）、毫秒（13 位）或 ISO /
        常见日期字符串；多行并排便于对比。修改时区后所有行同步更新。
      </p>
    </div>
  );
}
