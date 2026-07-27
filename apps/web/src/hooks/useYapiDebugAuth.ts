import type { O5EnvBootstrapResponse } from "@mt-dev/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import { loginApp } from "@/lib/external-login";
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

export function useYapiDebugAuth() {
  const [session, setSession] = useState<YapiDebugAuthSession | null>(() => loadDebugAuth());
  const [accounts, setAccounts] = useState<O5Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingAccounts(true);
      setAccountsError(null);
      try {
        const res = await fetch("/api/o5-env/bootstrap");
        if (!res.ok) {
          throw new Error(
            res.status === 503 ? "MongoDB 未配置，无法加载账号" : `加载失败 (${res.status})`,
          );
        }
        const body = (await res.json()) as O5EnvBootstrapResponse;
        const flat: O5Account[] = [];
        for (const sys of body.systems) {
          for (const a of sys.accounts) {
            flat.push({
              id: a.id,
              username: a.username,
              password: a.password,
              name: a.name,
              corpList: a.corpList ?? [],
            });
          }
        }
        if (!cancelled) setAccounts(dedupeAccounts(flat));
      } catch (err) {
        if (!cancelled) {
          setAccounts([]);
          setAccountsError(err instanceof Error ? err.message : "加载账号失败");
        }
      } finally {
        if (!cancelled) setLoadingAccounts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithAccount = useCallback(async (account: O5Account) => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      const result = await loginApp(account.username, account.password);
      const next: YapiDebugAuthSession = {
        username: account.username,
        name: result.name || account.name,
        accessToken: result.access_token,
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
    logout,
  };
}
