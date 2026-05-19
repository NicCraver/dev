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
      <mark className="rounded-sm bg-etherium-blue/25 px-0.5 text-etherium-blue">
        {text.slice(index, index + trimmed.length)}
      </mark>
      {text.slice(index + trimmed.length)}
    </span>
  );
}

export function accountCardClassName(isActive: boolean) {
  return cn(
    "bg-midnight-gaze hover:border-starlight-violet/30 rounded-xl border border-violet-edge px-4 py-3 shadow-card transition-[border-color,box-shadow] duration-200 hover:shadow-card-hover",
    isActive && "border-starlight-violet ring-starlight-violet/40 ring-2",
  );
}
