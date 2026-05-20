import { Columns2, Columns3, ListViewIcon, Monitor } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Icon, type IconSvgElement } from "@/components/ui/icon";
import type { O5GridLayout } from "@/hooks/useO5GridLayout";
import { segmentButtonClasses } from "@/lib/interaction";
import { cn } from "@/lib/utils";

const LAYOUT_OPTIONS: {
  value: O5GridLayout;
  label: string;
  icon: IconSvgElement;
}[] = [
  { value: "auto", label: "自动布局", icon: Monitor },
  { value: "1", label: "1 列", icon: ListViewIcon },
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
      className="bg-muted/40 inline-flex items-center gap-0.5 rounded-md border p-0.5"
      role="group"
      aria-label="账号列表布局"
    >
      {LAYOUT_OPTIONS.map(({ value, label, icon }) => {
        const selected = layout === value;
        return (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-7 w-7 p-0", segmentButtonClasses(selected))}
            aria-pressed={selected}
            aria-label={label}
            title={label}
            onClick={() => onChange(value)}
          >
            <Icon icon={icon} className="size-3.5" />
          </Button>
        );
      })}
    </div>
  );
}
