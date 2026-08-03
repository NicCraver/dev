import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { YapiDebugIfacePicker } from "@/components/yapi/YapiDebugIfacePicker";
import { YapiDebugRequestEditor } from "@/components/yapi/YapiDebugRequestEditor";
import { YapiDebugResponsePanel } from "@/components/yapi/YapiDebugResponsePanel";
import { YapiDebugToolbar } from "@/components/yapi/YapiDebugToolbar";
import { YAPI_BASE } from "@/hooks/useYapiAuth";
import { useYapiDebugAuth } from "@/hooks/useYapiDebugAuth";
import { HttpProxyError, sendViaProxy, type HttpProxyResponse } from "@/lib/http-proxy-api";
import {
  getInterface,
  listMenu,
  listProjects,
  type YapiListItem,
  type YapiMenuCat,
  type YapiProject,
} from "@/lib/yapi-api";
import type { YapiDebugAuthSession } from "@/lib/yapi-debug-auth";
import { getDebugEnv, loadDebugEnvId, type YapiDebugEnvId } from "@/lib/yapi-debug-env";
import {
  buildDebugDraft,
  buildO5HeaderPairs,
  composeRequestUrl,
  mergeO5Headers,
  type KvPair,
  type YapiDebugDraft,
} from "@/lib/yapi-debug-request";
import { convertYapiData } from "@/lib/yapi-import";
import type { HttpMethod, IfaceItem } from "@/lib/yapi-types";

const emptyDraft: YapiDebugDraft = {
  method: "GET",
  path: "/",
  query: [],
  headers: buildO5HeaderPairs(null),
  bodyText: "",
};

function syncO5HeadersInDraft(headers: KvPair[], session: YapiDebugAuthSession | null): KvPair[] {
  const managed = new Set(["content-type", "version", "clienttype", "authorization", "zxcorpid"]);
  const rest = headers.filter((h) => !managed.has(h.key.trim().toLowerCase()));
  return [...buildO5HeaderPairs(session), ...rest];
}

export function YapiDebugPage() {
  const [searchParams] = useSearchParams();
  const debugAuth = useYapiDebugAuth();

  const [envId, setEnvId] = useState<YapiDebugEnvId>(() => loadDebugEnvId());
  const [projects, setProjects] = useState<YapiProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [menu, setMenu] = useState<YapiMenuCat[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selection, setSelection] = useState<{
    projectId: number | null;
    ifaceId: number | null;
    title: string;
  }>({ projectId: null, ifaceId: null, title: "" });
  const [draft, setDraft] = useState<YapiDebugDraft>(emptyDraft);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<HttpProxyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bootstrappedQuery = useRef(false);

  const projectId = selection.projectId;
  const selectedIfaceId = selection.ifaceId;
  const ifaceTitle = selection.title;

  const project = useMemo(
    () => projects.find((p) => p._id === projectId) ?? null,
    [projects, projectId],
  );

  const loadIfaceDetail = useCallback(
    async (id: number) => {
      try {
        const raw = await getInterface(id);
        const iface: IfaceItem = convertYapiData(
          raw as Parameters<typeof convertYapiData>[0],
          String(raw.catid ?? "debug"),
          undefined,
          { custom: false },
        );
        setSelection((prev) => ({ ...prev, ifaceId: id, title: iface.title }));
        setDraft(buildDebugDraft(iface, debugAuth.session));
        setResponse(null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载接口失败");
      }
    },
    [debugAuth.session],
  );

  useEffect(() => {
    let cancelled = false;
    void listProjects()
      .then((list) => {
        if (!cancelled) setProjects(list);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (bootstrappedQuery.current || projectsLoading) return;
    const qProject = Number(searchParams.get("project") || "");
    const qIface = Number(searchParams.get("iface") || "");
    if (!Number.isNaN(qProject) && qProject > 0) {
      setSelection((prev) => ({ ...prev, projectId: qProject }));
    }
    if (!Number.isNaN(qIface) && qIface > 0) {
      void loadIfaceDetail(qIface);
    }
    bootstrappedQuery.current = true;
  }, [projectsLoading, searchParams, loadIfaceDetail]);

  useEffect(() => {
    if (!projectId) {
      setMenu([]);
      return;
    }
    let cancelled = false;
    setMenuLoading(true);
    void listMenu(projectId)
      .then((data) => {
        if (!cancelled) setMenu(data);
      })
      .catch(() => {
        if (!cancelled) setMenu([]);
      })
      .finally(() => {
        if (!cancelled) setMenuLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      headers: syncO5HeadersInDraft(prev.headers, debugAuth.session),
    }));
  }, [debugAuth.session]);

  const onSelectIface = (item: YapiListItem) => {
    setSelection((prev) => ({ ...prev, ifaceId: item._id, title: item.title }));
    void loadIfaceDetail(item._id);
  };

  const onProjectChange = (id: number) => {
    setSelection({ projectId: id, ifaceId: null, title: "" });
    setDraft(emptyDraft);
    setResponse(null);
    setError(null);
  };

  const canSend =
    !!selectedIfaceId && !!debugAuth.session?.accessToken && !!debugAuth.session?.corpId;
  const sendHint = !selectedIfaceId
    ? "请先选择接口"
    : !debugAuth.session
      ? "请先登录 O5 账号后再发送"
      : !debugAuth.session.corpId
        ? "请选择企业（zxCorpId）"
        : null;

  const onSend = async () => {
    if (!canSend || !debugAuth.session) return;
    setSending(true);
    setError(null);
    try {
      const env = getDebugEnv(envId);
      const url = composeRequestUrl(env.baseURL, draft.path, draft.query, project?.basepath);
      const headers = mergeO5Headers(draft.headers, debugAuth.session);
      const method = draft.method;
      const body = method !== "GET" && draft.bodyText.trim() ? draft.bodyText : undefined;
      const res = await sendViaProxy({ url, method, headers, body });
      setResponse(res);
    } catch (err) {
      setResponse(null);
      if (err instanceof HttpProxyError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "发送失败");
      }
    } finally {
      setSending(false);
    }
  };

  const patchDraft = <K extends keyof YapiDebugDraft>(key: K, value: YapiDebugDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="border-border/60 flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link to={`${YAPI_BASE}/projects`}>
            <Icon icon={ArrowLeft01Icon} className="size-3.5" />
            项目
          </Link>
        </Button>
        <div>
          <h1 className="text-base font-semibold text-slate-800">接口调试</h1>
          <p className="text-muted-foreground text-xs">
            {ifaceTitle ? ifaceTitle : "选择接口后编辑参数并发送"}
          </p>
        </div>
      </header>

      <YapiDebugToolbar
        envId={envId}
        onEnvChange={setEnvId}
        session={debugAuth.session}
        accounts={debugAuth.accounts}
        selectedAccount={debugAuth.selectedAccount}
        loadingAccounts={debugAuth.loadingAccounts}
        accountsError={debugAuth.accountsError}
        loggingIn={debugAuth.loggingIn}
        loginError={debugAuth.loginError}
        onLogin={debugAuth.loginWithAccount}
        onCorpChange={debugAuth.setCorp}
        onLogout={debugAuth.logout}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <YapiDebugIfacePicker
          projects={projects}
          projectsLoading={projectsLoading}
          projectId={projectId}
          onProjectChange={onProjectChange}
          menu={menu}
          menuLoading={menuLoading}
          selectedIfaceId={selectedIfaceId}
          onSelectIface={onSelectIface}
        />

        <div className="scrollbar-thin flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <YapiDebugRequestEditor
            method={draft.method as HttpMethod}
            path={draft.path}
            query={draft.query}
            headers={draft.headers}
            bodyText={draft.bodyText}
            sending={sending}
            canSend={canSend}
            sendHint={sendHint}
            onPathChange={(path) => patchDraft("path", path)}
            onQueryChange={(query: KvPair[]) => patchDraft("query", query)}
            onHeadersChange={(headers: KvPair[]) => patchDraft("headers", headers)}
            onBodyChange={(bodyText) => patchDraft("bodyText", bodyText)}
            onSend={() => void onSend()}
          />
          <YapiDebugResponsePanel response={response} error={error} />
        </div>
      </div>
    </div>
  );
}
