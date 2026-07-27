import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/lib/yapi-types";

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  POST: "bg-primary/10 text-primary border-primary/20",
  PUT: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

type YapiMethodBadgeProps = {
  method: string;
  className?: string;
};

export function YapiMethodBadge({ method, className }: YapiMethodBadgeProps) {
  const m = String(method).toUpperCase();
  const style = METHOD_STYLES[m as HttpMethod] ?? METHOD_STYLES.GET;
  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-[10px] font-semibold tracking-wide", style, className)}
    >
      {m}
    </Badge>
  );
}
