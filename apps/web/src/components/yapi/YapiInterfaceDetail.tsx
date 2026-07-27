import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  InformationCircleIcon,
  LinkSquare01Icon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { YapiMethodBadge } from "@/components/yapi/YapiMethodBadge";
import {
  YapiBodyBlock,
  YapiHeaderTable,
  YapiParamTable,
  YapiResponseBlock,
} from "@/components/yapi/YapiDetailBlocks";
import { cn } from "@/lib/utils";
import { useCopyYapiIface } from "@/hooks/useCopyYapiIface";
import { YAPI_BASE } from "@/hooks/useYapiAuth";
import { resolveYapiInterfacePageUrl } from "@/lib/yapi-external-url";
import type { Category, IfaceItem } from "@/lib/yapi-types";
import { STATUS_LABEL } from "@/lib/yapi-types";

type YapiInterfaceDetailProps = {
  iface: IfaceItem;
  cat: Category | null;
  loading?: boolean;
  onDeleteItem?: (id: string) => void;
  getCachedDetail?: (id: string) => IfaceItem | undefined;
  yapiProjectId?: number | null;
};

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="bg-muted h-6 w-2/3 rounded" />
      <div className="bg-muted h-4 w-full rounded" />
      <div className="bg-muted h-32 w-full rounded-xl" />
      <div className="bg-muted h-24 w-full rounded-xl" />
    </div>
  );
}

const STATUS_STYLES = {
  done: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  dev: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  deprecated: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export function YapiInterfaceDetail({
  iface,
  cat,
  loading,
  onDeleteItem,
  getCachedDetail,
  yapiProjectId,
}: YapiInterfaceDetailProps) {
  const [pathCopied, setPathCopied] = useState(false);
  const pathTimer = useRef<number | null>(null);
  const { copyIface, isCopied, isCopying } = useCopyYapiIface(getCachedDetail);
  const canDelete = !!(iface.custom || cat?.custom);
  const docCopied = isCopied(iface.id);
  const docCopying = isCopying(iface.id);

  useEffect(() => {
    setPathCopied(false);
    if (pathTimer.current) window.clearTimeout(pathTimer.current);
  }, [iface.id]);

  const copyPath = () => {
    void navigator.clipboard?.writeText(iface.path);
    setPathCopied(true);
    if (pathTimer.current) window.clearTimeout(pathTimer.current);
    pathTimer.current = window.setTimeout(() => setPathCopied(false), 1400);
  };

  const copyDoc = () => {
    void copyIface(iface, cat);
  };

  if (loading) return <DetailSkeleton />;

  const hasQuery = iface.query?.length > 0;
  const hasPath = iface.pathParams?.length > 0;
  const yapiPageUrl = resolveYapiInterfacePageUrl(iface, yapiProjectId);

  return (
    <div className="scrollbar-thin flex h-full flex-col overflow-y-auto bg-[#f8fafc]">
      <div className="space-y-6 p-6">
        <div>
          <div className="text-muted-foreground mb-2 text-xs">
            接口文档 / {cat ? cat.name : "未分类"} /{" "}
            <span className="text-foreground">{iface.title}</span>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-xl font-semibold text-slate-800">{iface.title}</h1>
            <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[iface.status])}>
              {STATUS_LABEL[iface.status]}
            </Badge>
            {canDelete && onDeleteItem ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/20 hover:bg-destructive/5 ml-auto"
                onClick={() => onDeleteItem(iface.id)}
              >
                <Icon icon={Delete02Icon} className="size-3.5" />
                删除接口
              </Button>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-2 text-sm">{iface.desc}</p>
          <div className="border-border/60 mt-4 flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3">
            <YapiMethodBadge method={iface.method} />
            <code className="font-mono text-sm text-slate-800">{iface.path}</code>
            <div className="ml-auto flex flex-wrap gap-2">
              {iface.yapiId ? (
                <Button type="button" size="sm" asChild>
                  <Link
                    to={`${YAPI_BASE}/debug?${new URLSearchParams({
                      ...(yapiProjectId ? { project: String(yapiProjectId) } : {}),
                      iface: String(iface.yapiId),
                    }).toString()}`}
                  >
                    <Icon icon={SourceCodeIcon} className="size-3.5" />
                    调试
                  </Link>
                </Button>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={copyPath}>
                <Icon icon={pathCopied ? CheckmarkCircle02Icon : Copy01Icon} className="size-3.5" />
                {pathCopied ? "已复制" : "复制路径"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={docCopying}
                onClick={copyDoc}
              >
                <Icon icon={docCopied ? CheckmarkCircle02Icon : Copy01Icon} className="size-3.5" />
                {docCopying ? "复制中…" : docCopied ? "已复制" : "复制文档"}
              </Button>
              {yapiPageUrl ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={yapiPageUrl} target="_blank" rel="noopener noreferrer">
                    <Icon icon={LinkSquare01Icon} className="size-3.5" />
                    在 YApi 打开
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["请求方法", iface.method],
              ["维护人", iface.author],
              ["更新时间", iface.updAt],
              ["标签", (iface.tag || []).join("、") || "—"],
            ].map(([k, v]) => (
              <div key={k} className="border-border/60 rounded-lg border bg-white px-3 py-2">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wide">{k}</div>
                <div className="mt-0.5 text-sm text-slate-800">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <section className="border-border/60 rounded-xl border bg-white p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Icon icon={InformationCircleIcon} className="text-primary size-4" />
            接口说明
          </h2>
          <p className="text-muted-foreground text-sm">{iface.desc}</p>
          {iface.note ? (
            <div className="bg-muted/40 mt-3 rounded-lg px-3 py-2 text-sm text-slate-700">
              <b>说明：</b>
              {iface.note}
            </div>
          ) : null}
        </section>

        {hasPath ? (
          <section className="border-border/60 rounded-xl border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Path 参数</h2>
            <YapiParamTable fields={iface.pathParams} />
          </section>
        ) : null}

        {hasQuery ? (
          <section className="border-border/60 rounded-xl border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Query 参数</h2>
            <YapiParamTable fields={iface.query} />
          </section>
        ) : null}

        <section className="border-border/60 rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">请求头</h2>
          <YapiHeaderTable headers={iface.headers} />
        </section>

        <section className="border-border/60 rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">请求体 Body</h2>
          <YapiBodyBlock body={iface.body} />
        </section>

        <section className="border-border/60 rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">响应示例</h2>
          <YapiResponseBlock responses={iface.responses} />
        </section>

        <section className="border-border/60 rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">返回数据结构</h2>
          <YapiParamTable fields={iface.returns.fields} showExample />
        </section>
      </div>
    </div>
  );
}
