import type { O5EnvBootstrapResponse, O5SystemDto } from "@mt-dev/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import { o5AccountsByEnv, o5Environments, o5Systems } from "@/mocks/o5-env";
import type { O5Account, O5Environment, O5System } from "@/types/o5-env";

const CACHE_KEY = "o5-env-cache";

type CacheData = {
  version: string;
  lastActiveSystem?: string;
  systems: Record<string, { lastActiveUrl?: string }>;
};

function readCache(): CacheData {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { version: "1.0.0", systems: {} };
    return JSON.parse(raw) as CacheData;
  } catch {
    return { version: "1.0.0", systems: {} };
  }
}

function writeCache(patch: Partial<CacheData>) {
  const current = readCache();
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...current, ...patch }));
}

function mapDtoToView(dto: O5SystemDto): {
  system: O5System;
  environments: O5Environment[];
  accounts: O5Account[];
} {
  return {
    system: {
      id: dto.id,
      name: dto.name,
      count: dto.environments.length,
    },
    environments: dto.environments.map((env) => ({
      id: env.id,
      systemId: dto.id,
      name: env.name,
      url: env.url,
      features: env.features,
    })),
    accounts: dto.accounts.map((a) => ({
      id: a.id,
      username: a.username,
      password: a.password,
      name: a.name,
      corpList: a.corpList ?? [],
    })),
  };
}

function buildMockBootstrap(): O5SystemDto[] {
  return o5Systems.map((system) => {
    const envs = o5Environments.filter((e) => e.systemId === system.id);
    const accountMap = new Map<string, O5Account>();

    for (const env of envs) {
      const accounts = o5AccountsByEnv[env.id] ?? [];
      for (const account of accounts) {
        if (!accountMap.has(account.username)) {
          accountMap.set(account.username, account);
        }
      }
    }

    return {
      id: system.id,
      name: system.name,
      environments: envs.map((env) => ({
        id: env.id,
        name: env.name,
        url: env.url,
        features: env.features,
      })),
      accounts: [...accountMap.values()],
    };
  });
}

export function useO5EnvData() {
  const [systems, setSystems] = useState<O5System[]>([]);
  const [environmentsBySystem, setEnvironmentsBySystem] = useState<Record<string, O5Environment[]>>(
    {},
  );
  const [accountsBySystem, setAccountsBySystem] = useState<Record<string, O5Account[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/o5-env/bootstrap");
      if (res.status === 503) {
        if (import.meta.env.DEV) {
          const mock = buildMockBootstrap();
          applyBootstrap(mock, true);
          return;
        }
        throw new Error("MongoDB 未配置，无法加载环境数据");
      }
      if (!res.ok) {
        throw new Error(`加载失败 (${res.status})`);
      }
      const body = (await res.json()) as O5EnvBootstrapResponse;
      applyBootstrap(body.systems, false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载失败";
      if (import.meta.env.DEV) {
        applyBootstrap(buildMockBootstrap(), true);
        setError(`${message}（已回退 mock）`);
      } else {
        setError(message);
        setSystems([]);
        setEnvironmentsBySystem({});
        setAccountsBySystem({});
      }
    } finally {
      setLoading(false);
    }

    function applyBootstrap(dtos: O5SystemDto[], mock: boolean) {
      const nextSystems: O5System[] = [];
      const nextEnvs: Record<string, O5Environment[]> = {};
      const nextAccounts: Record<string, O5Account[]> = {};

      for (const dto of dtos) {
        const mapped = mapDtoToView(dto);
        nextSystems.push(mapped.system);
        nextEnvs[dto.id] = mapped.environments;
        nextAccounts[dto.id] = mapped.accounts;
      }

      nextSystems.sort((a, b) => {
        const pin = (name: string) => name === "测试环境" || name === "测试";
        if (pin(a.name) && !pin(b.name)) return -1;
        if (pin(b.name) && !pin(a.name)) return 1;
        return a.name.localeCompare(b.name, "zh-CN");
      });

      setSystems(nextSystems);
      setEnvironmentsBySystem(nextEnvs);
      setAccountsBySystem(nextAccounts);
      setUsingMock(mock);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cache = useMemo(() => readCache(), [systems]);

  const persistSelection = useCallback((systemName: string, envName: string) => {
    const current = readCache();
    writeCache({
      lastActiveSystem: systemName,
      systems: {
        ...current.systems,
        [systemName]: { lastActiveUrl: envName },
      },
    });
  }, []);

  const resolveInitialEnvId = useCallback(
    (systemId: string, environments: O5Environment[]): string | null => {
      if (environments.length === 0) return null;
      const system = systems.find((s) => s.id === systemId);
      const cachedNote = system ? cache.systems[system.name]?.lastActiveUrl : undefined;
      if (cachedNote) {
        const match = environments.find((e) => e.name === cachedNote);
        if (match) return match.id;
      }
      return environments[0]?.id ?? null;
    },
    [cache.systems, systems],
  );

  return {
    systems,
    environmentsBySystem,
    accountsBySystem,
    loading,
    error,
    usingMock,
    writable: !usingMock && systems.length > 0,
    refetch: load,
    persistSelection,
    resolveInitialEnvId,
    lastActiveSystemName: cache.lastActiveSystem,
  };
}
