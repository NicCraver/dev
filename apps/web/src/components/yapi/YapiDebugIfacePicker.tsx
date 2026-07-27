import { useMemo, useState } from "react";

import { YapiMethodBadge } from "@/components/yapi/YapiMethodBadge";
import { cn } from "@/lib/utils";
import type { YapiListItem, YapiMenuCat, YapiProject } from "@/lib/yapi-api";

type YapiDebugIfacePickerProps = {
  projects: YapiProject[];
  projectsLoading: boolean;
  projectId: number | null;
  onProjectChange: (id: number) => void;
  menu: YapiMenuCat[];
  menuLoading: boolean;
  selectedIfaceId: number | null;
  onSelectIface: (item: YapiListItem) => void;
};

export function YapiDebugIfacePicker({
  projects,
  projectsLoading,
  projectId,
  onProjectChange,
  menu,
  menuLoading,
  selectedIfaceId,
  onSelectIface,
}: YapiDebugIfacePickerProps) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return menu
      .map((cat) => {
        const list = (cat.list || []).filter((item) => {
          if (!needle) return true;
          return (
            item.title.toLowerCase().includes(needle) ||
            item.path.toLowerCase().includes(needle) ||
            item.method.toLowerCase().includes(needle)
          );
        });
        return { cat, list };
      })
      .filter((x) => x.list.length > 0);
  }, [menu, q]);

  return (
    <aside className="border-border/60 flex h-full min-h-0 w-[280px] shrink-0 flex-col border-r bg-white">
      <div className="space-y-2 border-b border-border/60 p-3">
        <label className="text-muted-foreground text-xs">项目</label>
        <select
          className="border-border/60 focus:border-primary/40 w-full rounded-lg border bg-white px-2 py-1.5 text-sm outline-none"
          value={projectId ?? ""}
          disabled={projectsLoading}
          onChange={(e) => {
            const id = Number(e.target.value);
            if (!Number.isNaN(id)) onProjectChange(id);
          }}
        >
          <option value="">{projectsLoading ? "加载中…" : "选择项目"}</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="搜索接口"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border-border/60 focus:border-primary/40 focus:ring-primary/12 w-full rounded-lg border bg-white px-2 py-1.5 text-sm outline-none focus:ring-2"
        />
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
        {!projectId && <p className="text-muted-foreground px-2 py-4 text-xs">请先选择项目</p>}
        {projectId && menuLoading && (
          <p className="text-muted-foreground px-2 py-4 text-xs">加载接口…</p>
        )}
        {projectId && !menuLoading && filtered.length === 0 && (
          <p className="text-muted-foreground px-2 py-4 text-xs">无匹配接口</p>
        )}
        {filtered.map(({ cat, list }) => (
          <div key={cat._id} className="mb-3">
            <div className="text-muted-foreground px-2 py-1 text-[11px] font-medium uppercase tracking-wide">
              {cat.name}
            </div>
            <ul className="space-y-0.5">
              {list.map((item) => {
                const active = selectedIfaceId === item._id;
                return (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => onSelectIface(item)}
                      className={cn(
                        "flex w-full flex-col gap-0.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                        active ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-slate-800",
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <YapiMethodBadge method={item.method} />
                        <span className="truncate text-xs font-medium">{item.title}</span>
                      </span>
                      <span className="text-muted-foreground truncate font-mono text-[10px]">
                        {item.path}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
