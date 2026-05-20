import { ArrowDown01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  DEFAULT_TIMEZONE,
  formatTimezoneOption,
  getSupportedTimezones,
  searchTimezones,
} from "@/lib/timezones";
import { cn } from "@/lib/utils";

type TimezonePickerProps = {
  value: string;
  onChange: (timeZone: string) => void;
  className?: string;
};

export function TimezonePicker({ value, onChange, className }: TimezonePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allZones = useMemo(() => getSupportedTimezones(), []);
  const filtered = useMemo(() => searchTimezones(allZones, query), [allZones, query]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const displayLabel = formatTimezoneOption(value);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="h-9 w-full max-w-md justify-between gap-2 px-3 font-normal"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate text-left">{displayLabel}</span>
        <Icon icon={ArrowDown01Icon} className="text-muted-foreground size-4 shrink-0" />
      </Button>

      {open && (
        <div className="border-border bg-card absolute top-full z-50 mt-1 flex w-full max-w-md flex-col overflow-hidden rounded-lg border shadow-lg">
          <div className="border-border border-b p-2">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索时区、城市或偏移（如 Shanghai、+8）"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
            />
          </div>
          <ul
            className="scrollbar-thin max-h-64 overflow-y-auto overscroll-y-contain py-1"
            role="listbox"
            aria-label="时区列表"
          >
            {filtered.length === 0 ? (
              <li className="text-muted-foreground px-3 py-6 text-center text-sm">无匹配时区</li>
            ) : (
              filtered.map((zone) => {
                const selected = zone === value;
                return (
                  <li key={zone} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={cn(
                        "hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                        selected && "bg-accent/60",
                      )}
                      onClick={() => {
                        onChange(zone);
                        setOpen(false);
                      }}
                    >
                      <Icon
                        icon={Tick01Icon}
                        className={cn("size-4 shrink-0", selected ? "opacity-100" : "opacity-0")}
                      />
                      <span className="truncate">{formatTimezoneOption(zone)}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {value !== DEFAULT_TIMEZONE && (
            <div className="border-border border-t p-2">
              <button
                type="button"
                className="text-primary hover:bg-accent w-full rounded-md px-2 py-1.5 text-left text-xs"
                onClick={() => {
                  onChange(DEFAULT_TIMEZONE);
                  setOpen(false);
                }}
              >
                恢复默认（{formatTimezoneOption(DEFAULT_TIMEZONE)}）
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
