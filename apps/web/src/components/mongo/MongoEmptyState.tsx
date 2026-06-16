import type { IconSvgElement } from "@/components/ui/icon";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type MongoEmptyStateProps = {
  icon: IconSvgElement;
  title: string;
  description?: string;
  className?: string;
};

export function MongoEmptyState({ icon, title, description, className }: MongoEmptyStateProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-col items-center justify-center gap-2 px-4 py-10 text-center",
        className,
      )}
    >
      <div className="bg-muted/60 flex size-10 items-center justify-center rounded-full">
        <Icon icon={icon} className="size-4 opacity-70" strokeWidth={1.75} />
      </div>
      <p className="text-foreground text-sm font-medium">{title}</p>
      {description && <p className="max-w-[220px] text-xs leading-relaxed">{description}</p>}
    </div>
  );
}
