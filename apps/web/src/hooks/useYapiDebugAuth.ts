import type { Corp } from "@mt-dev/shared";
import { useCallback, useMemo, useState } from "react";

import { useO5EnvData } from "@/hooks/useO5EnvData";
import { fetchCorpList, loginApp } from "@/lib/external-login";
import {
  clearDebugAuth,
  loadDebugAuth,
  saveDebugAuth,
  type YapiDebugAuthSession,
} from "@/lib/yapi-debug-auth";
import type { O5Account } from "@/types/o5-env";

function dedupeAccounts(accounts: O5Account[]): O5Account[] {
  const seen = new Set<string>();
  const out: O5Account[] = [];
  for (const a of accounts) {
    if (seen.has(a.username)) continue;
    seen.add(a.username);
    out.push(a);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

function pickCorp(corps: Corp[], preferredId?: string): Corp | null {
  if (!corps.length) return null;
  if (preferredId) {
    const found = corps.find((c) => c.corpId === preferredId);
    if (found) return found;
  }
  return corps[0] ?? null;
}

export function useYapiDebugAuth() {
  const { accountsBySystem, loading: loadingAccounts, error: accountsError } = useO5EnvData();
  const [session, setSession] = useState<YapiDebugAuthSession | null>(() => loadDebugAuth());
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const accounts = useMemo(
    () => dedupeAccounts(Object.values(accountsBySystem).flat()),
    [accountsBySystem],
  );

  const loginWithAccount = useCallback(async (account: O5Account, corpId?: string) => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      const result = await loginApp(account.username, account.password);
      let corps = account.corpList ?? [];
      if (!corps.length) {
        try {
          corps = await fetchCorpList(result.access_token);
        } catch {
          corps = [];
        }
      }
      const corp = pickCorp(corps, corpId);
      if (!corp) {
        throw new Error("该账号没有可用企业，无法设置 zxCorpId");
      }
      const next: YapiDebugAuthSession = {
        username: account.username,
        name: result.name || account.name,
        accessToken: result.access_token,
        corpId: corp.corpId,
        corpName: corp.name,
        clientType: "app",
      };
      saveDebugAuth(next);
      setSession(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "登录失败";
      setLoginError(message);
      throw err;
    } finally {
      setLoggingIn(false);
    }
  }, []);

  const setCorp = useCallback((corp: Corp) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next: YapiDebugAuthSession = {
        ...prev,
        corpId: corp.corpId,
        corpName: corp.name,
      };
      saveDebugAuth(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    clearDebugAuth();
    setSession(null);
    setLoginError(null);
  }, []);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.username === session?.username) ?? null,
    [accounts, session?.username],
  );

  return {
    session,
    accounts,
    selectedAccount,
    loadingAccounts,
    accountsError,
    loggingIn,
    loginError,
    loginWithAccount,
    setCorp,
    logout,
  };
}
