import { Button } from "@/components/ui/button";
import {
  getDebugEnv,
  loadDebugEnvId,
  saveDebugEnvId,
  YAPI_DEBUG_ENVS,
  type YapiDebugEnvId,
} from "@/lib/yapi-debug-env";
import type { O5Account } from "@/types/o5-env";
import type { YapiDebugAuthSession } from "@/lib/yapi-debug-auth";
import { useState } from "react";

type YapiDebugToolbarProps = {
  envId: YapiDebugEnvId;
  onEnvChange: (id: YapiDebugEnvId) => void;
  session: YapiDebugAuthSession | null;
  accounts: O5Account[];
  loadingAccounts: boolean;
  accountsError: string | null;
  loggingIn: boolean;
  loginError: string | null;
  onLogin: (account: O5Account) => Promise<void>;
  onLogout: () => void;
};

export function YapiDebugToolbar({
  envId,
  onEnvChange,
  session,
  accounts,
  loadingAccounts,
  accountsError,
  loggingIn,
  loginError,
  onLogin,
  onLogout,
}: YapiDebugToolbarProps) {
  const [accountId, setAccountId] = useState("");

  const env = getDebugEnv(envId);

  return (
    <div className="border-border/60 flex shrink-0 flex-wrap items-center gap-3 border-b bg-white/80 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">环境</span>
        <select
          className="border-border/60 focus:border-primary/40 rounded-lg border bg-white px-2 py-1.5 text-sm outline-none"
          value={envId}
          onChange={(e) => {
            const id = e.target.value as YapiDebugEnvId;
            saveDebugEnvId(id);
            onEnvChange(id);
          }}
        >
          {YAPI_DEBUG_ENVS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <code className="text-muted-foreground hidden font-mono text-[11px] sm:inline">
          {env.baseURL}
        </code>
      </div>

      <div className="bg-border/60 hidden h-5 w-px sm:block" />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">O5 账号</span>
        {session ? (
          <>
            <span className="text-sm text-slate-800">
              {session.name || session.username}
              <span className="text-muted-foreground ml-1 text-xs">({session.username})</span>
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={onLogout}>
              登出
            </Button>
          </>
        ) : (
          <>
            <select
              className="border-border/60 focus:border-primary/40 max-w-[220px] rounded-lg border bg-white px-2 py-1.5 text-sm outline-none"
              value={accountId}
              disabled={loadingAccounts || loggingIn}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">{loadingAccounts ? "加载账号…" : "选择账号"}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.username} ({a.username})
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              disabled={!accountId || loggingIn}
              onClick={() => {
                const account = accounts.find((a) => a.id === accountId);
                if (account) void onLogin(account);
              }}
            >
              {loggingIn ? "登录中…" : "登录"}
            </Button>
          </>
        )}
      </div>

      {accountsError ? <span className="text-destructive text-xs">{accountsError}</span> : null}
      {loginError ? <span className="text-destructive text-xs">{loginError}</span> : null}
    </div>
  );
}

export { loadDebugEnvId };
