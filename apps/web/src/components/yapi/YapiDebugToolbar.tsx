import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { YapiDebugAuthSession } from "@/lib/yapi-debug-auth";
import {
  getDebugEnv,
  saveDebugEnvId,
  YAPI_DEBUG_ENVS,
  type YapiDebugEnvId,
} from "@/lib/yapi-debug-env";
import type { O5Account } from "@/types/o5-env";
import type { Corp } from "@mt-dev/shared";

type YapiDebugToolbarProps = {
  envId: YapiDebugEnvId;
  onEnvChange: (id: YapiDebugEnvId) => void;
  session: YapiDebugAuthSession | null;
  accounts: O5Account[];
  selectedAccount: O5Account | null;
  loadingAccounts: boolean;
  accountsError: string | null;
  loggingIn: boolean;
  loginError: string | null;
  onLogin: (account: O5Account, corpId?: string) => Promise<void>;
  onCorpChange: (corp: Corp) => void;
  onLogout: () => void;
};

export function YapiDebugToolbar({
  envId,
  onEnvChange,
  session,
  accounts,
  selectedAccount,
  loadingAccounts,
  accountsError,
  loggingIn,
  loginError,
  onLogin,
  onCorpChange,
  onLogout,
}: YapiDebugToolbarProps) {
  const [accountId, setAccountId] = useState("");
  const [corpId, setCorpId] = useState("");

  const env = getDebugEnv(envId);

  const pendingAccount = useMemo(
    () => accounts.find((a) => a.id === accountId) ?? null,
    [accounts, accountId],
  );

  const pendingCorps = pendingAccount?.corpList ?? [];
  const sessionCorps = selectedAccount?.corpList ?? [];

  return (
    <div className="border-border/60 flex shrink-0 flex-wrap items-center gap-3 border-b bg-white/80 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs" id="yapi-debug-env-label">
          环境
        </span>
        <select
          aria-labelledby="yapi-debug-env-label"
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
        <span className="text-muted-foreground text-xs" id="yapi-debug-account-label">
          O5 账号
        </span>
        {session ? (
          <>
            <span className="text-sm text-slate-800">
              {session.name || session.username}
              <span className="text-muted-foreground ml-1 text-xs">({session.username})</span>
            </span>
            {sessionCorps.length > 1 ? (
              <select
                aria-label="选择企业"
                className="border-border/60 focus:border-primary/40 max-w-[200px] rounded-lg border bg-white px-2 py-1.5 text-sm outline-none"
                value={session.corpId}
                onChange={(e) => {
                  const corp = sessionCorps.find((c) => c.corpId === e.target.value);
                  if (corp) onCorpChange(corp);
                }}
              >
                {sessionCorps.map((c) => (
                  <option key={c.corpId} value={c.corpId}>
                    {c.name} ({c.corpId})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-muted-foreground text-xs">
                企业 {session.corpName || session.corpId || "—"}
              </span>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={onLogout}>
              登出
            </Button>
          </>
        ) : (
          <>
            <select
              aria-labelledby="yapi-debug-account-label"
              className="border-border/60 focus:border-primary/40 max-w-[220px] rounded-lg border bg-white px-2 py-1.5 text-sm outline-none"
              value={accountId}
              disabled={loadingAccounts || loggingIn}
              onChange={(e) => {
                setAccountId(e.target.value);
                setCorpId("");
              }}
            >
              <option value="">{loadingAccounts ? "加载账号…" : "选择账号"}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.username} ({a.username})
                </option>
              ))}
            </select>
            {pendingCorps.length > 1 ? (
              <select
                aria-label="选择企业"
                className="border-border/60 focus:border-primary/40 max-w-[200px] rounded-lg border bg-white px-2 py-1.5 text-sm outline-none"
                value={corpId}
                disabled={loggingIn}
                onChange={(e) => setCorpId(e.target.value)}
              >
                <option value="">选择企业</option>
                {pendingCorps.map((c) => (
                  <option key={c.corpId} value={c.corpId}>
                    {c.name} ({c.corpId})
                  </option>
                ))}
              </select>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={!accountId || loggingIn || (pendingCorps.length > 1 && !corpId)}
              onClick={() => {
                const account = accounts.find((a) => a.id === accountId);
                if (account) {
                  void onLogin(account, corpId || pendingCorps[0]?.corpId);
                }
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
