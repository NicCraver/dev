import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { YapiDebugIfacePicker } from "@/components/yapi/YapiDebugIfacePicker";
import { YapiDebugRequestEditor } from "@/components/yapi/YapiDebugRequestEditor";
import { YapiDebugResponsePanel } from "@/components/yapi/YapiDebugResponsePanel";
import { YapiDebugToolbar, loadDebugEnvId } from "@/components/yapi/YapiDebugToolbar";
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
import { convertYapiData } from "@/lib/yapi-import";
import { getDebugEnv, type YapiDebugEnvId } from "@/lib/yapi-debug-env";
import {
  buildDebugDraft,
  composeRequestUrl,
  mergeAuthHeader,
  type KvPair,
  type YapiDebugDraft,
} from "@/lib/yapi-debug-request";
import type { HttpMethod, IfaceItem } from "@/lib/yapi-types";

const emptyDraft: YapiDebugDraft = {
  method: "GET",
  path: "/",
  query: [],
  headers: [],
  bodyText: "",
};

export function YapiDebugPage() {
  const [searchParams] = useSearchParams();
  const debugAuth = useYapiDebugAuth();

  const [envId, setEnvId] = useState<YapiDebugEnvId>(() => loadDebugEnvId());
  const [projects, setProjects] = useState<YapiProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [menu, setMenu] = useState<YapiMenuCat[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedIfaceId, setSelectedIfaceId] = useState<number | null>(null);
  const [ifaceTitle, setIfaceTitle] = useState("");
  const [draft, setDraft] = useState<YapiDebugDraft>(emptyDraft);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<HttpProxyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bootstrappedQuery, setBootstrappedQuery] = useState(false);

  const project = useMemo(
    () => projects.find((p) => p._id === projectId) ?? null,
    [projects, projectId],
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
    if (bootstrappedQuery || projectsLoading) return;
    const qProject = Number(searchParams.get("project") || "");
    const qIface = Number(searchParams.get("iface") || "");
    if (!Number.isNaN(qProject) && qProject > 0) {
      setProjectId(qProject);
    }
    if (!Number.isNaN(qIface) && qIface > 0) {
      setSelectedIfaceId(qIface);
      void loadIfaceDetail(qIface);
    }
    setBootstrappedQuery(true);
  }, [bootstrappedQuery, projectsLoading, searchParams]);

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

  async function loadIfaceDetail(id: number) {
    try {
      const raw = await getInterface(id);
      const iface: IfaceItem = convertYapiData(
        raw as Parameters<typeof convertYapiData>[0],
        String(raw.catid ?? "debug"),
        undefined,
        {
          custom: false,
        },
      );
      setIfaceTitle(iface.title);
      setDraft(buildDebugDraft(iface));
      setResponse(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载接口失败");
    }
  }

  const onSelectIface = (item: YapiListItem) => {
    setSelectedIfaceId(item._id);
    setIfaceTitle(item.title);
    void loadIfaceDetail(item._id);
  };

  const onProjectChange = (id: number) => {
    setProjectId(id);
    setSelectedIfaceId(null);
    setIfaceTitle("");
    setDraft(emptyDraft);
    setResponse(null);
    setError(null);
  };

  const canSend = !!selectedIfaceId && !!debugAuth.session;
  const sendHint = !selectedIfaceId
    ? "请先选择接口"
    : !debugAuth.session
      ? "请先登录 O5 账号后再发送"
      : null;

  const onSend = async () => {
    if (!canSend || !debugAuth.session) return;
    setSending(true);
    setError(null);
    try {
      const env = getDebugEnv(envId);
      const url = composeRequestUrl(env.baseURL, draft.path, draft.query, project?.basepath);
      const headers = mergeAuthHeader(draft.headers, debugAuth.session.accessToken);
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
        loadingAccounts={debugAuth.loadingAccounts}
        accountsError={debugAuth.accountsError}
        loggingIn={debugAuth.loggingIn}
        loginError={debugAuth.loginError}
        onLogin={debugAuth.loginWithAccount}
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
