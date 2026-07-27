import { Button } from "@/components/ui/button";
import { YapiMethodBadge } from "@/components/yapi/YapiMethodBadge";
import type { KvPair } from "@/lib/yapi-debug-request";
import type { HttpMethod } from "@/lib/yapi-types";

type YapiDebugRequestEditorProps = {
  method: HttpMethod;
  path: string;
  query: KvPair[];
  headers: KvPair[];
  bodyText: string;
  sending: boolean;
  canSend: boolean;
  sendHint?: string | null;
  onPathChange: (path: string) => void;
  onQueryChange: (query: KvPair[]) => void;
  onHeadersChange: (headers: KvPair[]) => void;
  onBodyChange: (body: string) => void;
  onSend: () => void;
};

function KvEditor({
  title,
  pairs,
  onChange,
}: {
  title: string;
  pairs: KvPair[];
  onChange: (next: KvPair[]) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([...pairs, { key: "", value: "" }])}
        >
          添加
        </Button>
      </div>
      <div className="space-y-1.5">
        {pairs.length === 0 ? (
          <p className="text-muted-foreground text-xs">无</p>
        ) : (
          pairs.map((pair, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={pair.key}
                placeholder="key"
                onChange={(e) => {
                  const next = pairs.slice();
                  next[i] = { ...pair, key: e.target.value };
                  onChange(next);
                }}
                className="border-border/60 focus:border-primary/40 w-[36%] rounded-lg border bg-white px-2 py-1.5 font-mono text-xs outline-none"
              />
              <input
                value={pair.value}
                placeholder="value"
                onChange={(e) => {
                  const next = pairs.slice();
                  next[i] = { ...pair, value: e.target.value };
                  onChange(next);
                }}
                className="border-border/60 focus:border-primary/40 min-w-0 flex-1 rounded-lg border bg-white px-2 py-1.5 font-mono text-xs outline-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(pairs.filter((_, j) => j !== i))}
              >
                删
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function YapiDebugRequestEditor({
  method,
  path,
  query,
  headers,
  bodyText,
  sending,
  canSend,
  sendHint,
  onPathChange,
  onQueryChange,
  onHeadersChange,
  onBodyChange,
  onSend,
}: YapiDebugRequestEditorProps) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <YapiMethodBadge method={method} />
        <input
          value={path}
          onChange={(e) => onPathChange(e.target.value)}
          className="border-border/60 focus:border-primary/40 focus:ring-primary/12 min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2"
          placeholder="/api/path"
        />
        <Button type="button" disabled={!canSend || sending} onClick={onSend}>
          {sending ? "发送中…" : "发送"}
        </Button>
      </div>
      {sendHint ? <p className="text-muted-foreground text-xs">{sendHint}</p> : null}

      <KvEditor title="Query" pairs={query} onChange={onQueryChange} />
      <KvEditor title="Headers" pairs={headers} onChange={onHeadersChange} />

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800">Body</h3>
        <textarea
          value={bodyText}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={12}
          spellCheck={false}
          className="border-border/60 focus:border-primary/40 focus:ring-primary/12 w-full rounded-lg border bg-white px-3 py-2 font-mono text-xs outline-none focus:ring-2"
          placeholder={method === "GET" || method === "DELETE" ? "（通常无需 Body）" : "JSON"}
        />
      </section>
    </div>
  );
}
