import type { HttpProxyResponse } from "@/lib/http-proxy-api";

type YapiDebugResponsePanelProps = {
  response: HttpProxyResponse | null;
  error: string | null;
};

function formatBody(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return raw;
  }
}

export function YapiDebugResponsePanel({ response, error }: YapiDebugResponsePanelProps) {
  if (error) {
    return (
      <div className="border-border/60 border-t bg-[#f8fafc] p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">响应</h3>
        <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="border-border/60 border-t bg-[#f8fafc] p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">响应</h3>
        <p className="text-muted-foreground text-xs">发送请求后在此查看回参</p>
      </div>
    );
  }

  const statusOk = response.status >= 200 && response.status < 300;

  return (
    <div className="border-border/60 border-t bg-[#f8fafc] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold text-slate-800">响应</h3>
        <span
          className={
            statusOk
              ? "rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700"
              : "rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800"
          }
        >
          {response.status} {response.statusText}
        </span>
        <span className="text-muted-foreground text-xs">{response.durationMs} ms</span>
      </div>

      <details className="mb-3">
        <summary className="text-muted-foreground cursor-pointer text-xs">Response Headers</summary>
        <pre className="border-border/60 mt-2 max-h-40 overflow-auto rounded-lg border bg-white p-2 font-mono text-[11px] text-slate-700">
          {Object.entries(response.headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n") || "（无）"}
        </pre>
      </details>

      <pre className="border-border/60 max-h-[420px] overflow-auto rounded-lg border bg-white p-3 font-mono text-xs text-slate-800 whitespace-pre-wrap">
        {formatBody(response.body) || "（空 body）"}
      </pre>
    </div>
  );
}
