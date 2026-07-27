import { useState } from "react";

import type { BodySchema, HeaderField, ParamField, ResponseExample } from "@/lib/yapi-types";
import { cn } from "@/lib/utils";

function highlightJson(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc(json).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let cls = "text-amber-600";
      if (m.startsWith('"')) {
        cls = m.endsWith(":") ? "text-sky-400" : "text-emerald-400";
      } else if (/true|false/.test(m)) {
        cls = "text-violet-400";
      } else if (/null/.test(m)) {
        cls = "text-slate-500";
      }
      return `<span class="${cls}">${m}</span>`;
    },
  );
}

type ParamTableProps = {
  fields: ParamField[];
  depth?: number;
  showExample?: boolean;
};

export function YapiParamTable({ fields, depth = 0, showExample = true }: ParamTableProps) {
  if (!fields?.length) {
    return <div className="text-muted-foreground text-sm">无参数</div>;
  }

  const rows: { field: ParamField; depth: number }[] = [];
  const walk = (list: ParamField[], d: number) => {
    list.forEach((f) => {
      rows.push({ field: f, depth: d });
      if (f.children) walk(f.children, d + 1);
    });
  };
  walk(fields, depth);

  return (
    <div className="border-border/60 overflow-hidden rounded-lg border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">参数名</th>
            <th className="px-3 py-2 font-medium">类型</th>
            <th className="px-3 py-2 font-medium">必填</th>
            <th className="px-3 py-2 font-medium">说明</th>
            {showExample ? <th className="px-3 py-2 font-medium">示例</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ field, depth: d }) => (
            <tr key={`${field.name}-${d}`} className="border-border/40 border-t">
              <td
                className="px-3 py-2 font-mono text-slate-800"
                style={{ paddingLeft: 12 + d * 16 }}
              >
                {field.name}
              </td>
              <td className="text-muted-foreground px-3 py-2">{field.type}</td>
              <td className="px-3 py-2">{field.required ? "是" : "否"}</td>
              <td className="text-muted-foreground px-3 py-2">{field.desc || "—"}</td>
              {showExample ? (
                <td className="text-muted-foreground px-3 py-2 font-mono">
                  {field.example || "—"}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function YapiHeaderTable({ headers }: { headers: HeaderField[] }) {
  if (!headers?.length) {
    return <div className="text-muted-foreground text-sm">无自定义请求头</div>;
  }
  return (
    <div className="border-border/60 overflow-hidden rounded-lg border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">名称</th>
            <th className="px-3 py-2 font-medium">类型</th>
            <th className="px-3 py-2 font-medium">必填</th>
            <th className="px-3 py-2 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {headers.map((h) => (
            <tr key={h.name} className="border-border/40 border-t">
              <td className="px-3 py-2 font-mono">{h.name}</td>
              <td className="text-muted-foreground px-3 py-2">{h.type}</td>
              <td className="px-3 py-2">{h.required ? "是" : "否"}</td>
              <td className="text-muted-foreground px-3 py-2">{h.desc || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function YapiBodyBlock({ body }: { body: BodySchema | null }) {
  if (!body) {
    return <div className="text-muted-foreground text-sm">该接口无请求体（GET / DELETE）。</div>;
  }
  return (
    <div className="space-y-4">
      {body.fields.length > 0 ? (
        <div>
          <div className="mb-2 text-sm font-medium text-slate-800">字段说明</div>
          <YapiParamTable fields={body.fields} />
        </div>
      ) : null}
      <div>
        <div className="mb-2 text-sm font-medium text-slate-800">示例</div>
        <div className="overflow-hidden rounded-lg bg-slate-900">
          <div className="border-b border-white/10 px-3 py-1.5 text-[10px] text-slate-400">
            application/json
          </div>
          <pre
            className="scrollbar-thin overflow-auto p-3 font-mono text-xs leading-relaxed text-slate-100"
            dangerouslySetInnerHTML={{ __html: highlightJson(body.example) }}
          />
        </div>
      </div>
    </div>
  );
}

export function YapiResponseBlock({ responses }: { responses: ResponseExample[] }) {
  const [active, setActive] = useState(0);
  const resp = responses[active] ?? responses[0];
  if (!resp) return null;

  return (
    <div className="space-y-3">
      {responses.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {responses.map((r, i) => (
            <button
              key={r.code}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                active === i
                  ? "border-primary/30 bg-primary-soft text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/50",
              )}
            >
              {r.code} {r.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg bg-slate-900">
        <div className="border-b border-white/10 px-3 py-1.5 text-[10px] text-slate-400">
          {resp.desc}
        </div>
        <pre
          className="scrollbar-thin max-h-80 overflow-auto p-3 font-mono text-xs leading-relaxed text-slate-100"
          dangerouslySetInnerHTML={{ __html: highlightJson(resp.body) }}
        />
      </div>
    </div>
  );
}
