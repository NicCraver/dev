import { useCallback, useEffect, useState } from "react";

import type { MongoStatusResponse } from "@mt-dev/shared";

import { fetchMongoStatus } from "@/lib/mongo-api";
import { unlockPm2Page } from "@/lib/pm2-api";
import { getPm2UnlockToken, setPm2UnlockToken } from "@/lib/pm2-storage";

export function useMongoPageAccess() {
  const [status, setStatus] = useState<MongoStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(() => Boolean(getPm2UnlockToken()));

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchMongoStatus();
      setStatus(s);
      if (!s.pagePasswordRequired) {
        setUnlocked(true);
      } else if (!getPm2UnlockToken()) {
        setUnlocked(false);
      }
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const unlock = useCallback(async (password: string) => {
    setUnlockError(null);
    try {
      const token = await unlockPm2Page(password);
      if (token) setPm2UnlockToken(token);
      setUnlocked(true);
    } catch (err) {
      setUnlocked(false);
      setPm2UnlockToken("");
      setUnlockError(err instanceof Error ? err.message : "密码错误");
      throw err;
    }
  }, []);

  const lock = useCallback(() => {
    setPm2UnlockToken("");
    setUnlocked(false);
  }, []);

  return {
    status,
    loading,
    unlocked,
    unlockError,
    unlock,
    lock,
    reload: loadStatus,
  };
}
