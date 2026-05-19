import { cn } from "@/lib/utils";

export function HighlightText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <span className={className}>{text}</span>;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {text.slice(0, index)}
      <mark className="bg-primary/20 rounded-sm px-0.5">
        {text.slice(index, index + trimmed.length)}
      </mark>
      {text.slice(index + trimmed.length)}
    </span>
  );
}

export function accountCardClassName(isActive: boolean) {
  return cn(
    "bg-card hover:border-border/80 rounded-lg border px-4 py-3 shadow-xs transition-colors hover:shadow-sm",
    isActive && "border-primary ring-primary/30 ring-2",
  );
}
