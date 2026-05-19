import { Columns2, Columns3, LayoutList, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { O5GridLayout } from "@/hooks/useO5GridLayout";
import { cn } from "@/lib/utils";

const LAYOUT_OPTIONS: {
  value: O5GridLayout;
  label: string;
  icon: typeof Monitor;
}[] = [
  { value: "auto", label: "自动布局", icon: Monitor },
  { value: "1", label: "1 列", icon: LayoutList },
  { value: "2", label: "2 列", icon: Columns2 },
  { value: "3", label: "3 列", icon: Columns3 },
];

type AccountLayoutSwitcherProps = {
  layout: O5GridLayout;
  onChange: (layout: O5GridLayout) => void;
};

export function AccountLayoutSwitcher({ layout, onChange }: AccountLayoutSwitcherProps) {
  return (
    <div
      className="border-violet-edge bg-astral-deep inline-flex items-center gap-0.5 rounded-lg border p-0.5"
      role="group"
      aria-label="账号列表布局"
    >
      {LAYOUT_OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = layout === value;
        return (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-1 rounded-md px-2 transition-colors",
              selected
                ? "bg-cosmic-violet text-crystal-white hover:bg-cosmic-violet/90 hover:text-crystal-white"
                : "text-lunar-dust hover:bg-twilight-indigo/60 hover:text-crystal-white",
            )}
            aria-pressed={selected}
            aria-label={label}
            title={label}
            onClick={() => onChange(value)}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{value === "auto" ? "自动" : value}</span>
          </Button>
        );
      })}
    </div>
  );
}
