import { useCallback, useEffect, useState } from "react";

import type { Pm2ProcessDetail, Pm2ProcessSummary, Pm2StatusResponse } from "@mt-dev/shared";

import {
  fetchPm2ProcessDetail,
  fetchPm2Processes,
  fetchPm2Status,
  pm2Restart,
  pm2Save,
  pm2Start,
  pm2Stop,
} from "@/lib/pm2-api";
import { getPm2AutoSave, getPm2RefreshMs } from "@/lib/pm2-storage";

export function usePm2Data() {
  const [status, setStatus] = useState<Pm2StatusResponse | null>(null);
  const [processes, setProcesses] = useState<Pm2ProcessSummary[]>([]);
  const [selectedPmId, setSelectedPmId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Pm2ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const refreshStatus = useCallback(async () => {
    const s = await fetchPm2Status();
    setStatus(s);
    return s;
  }, []);

  const refreshProcesses = useCallback(async () => {
    const list = await fetchPm2Processes();
    setProcesses(list);
    if (selectedPmId != null && !list.some((p) => p.pmId === selectedPmId)) {
      setSelectedPmId(list[0]?.pmId ?? null);
    } else if (selectedPmId == null && list[0]) {
      setSelectedPmId(list[0].pmId);
    }
    return list;
  }, [selectedPmId]);

  const refreshDetail = useCallback(async (pmId: number) => {
    const d = await fetchPm2ProcessDetail(pmId);
    setDetail(d);
    return d;
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await refreshStatus();
      if (s.enabled && s.daemonReachable) {
        await refreshProcesses();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [refreshProcesses, refreshStatus]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const ms = getPm2RefreshMs();
    if (ms <= 0 || !status?.daemonReachable) return;
    const id = window.setInterval(() => {
      void refreshProcesses().catch(() => undefined);
    }, ms);
    return () => window.clearInterval(id);
  }, [refreshProcesses, status?.daemonReachable]);

  useEffect(() => {
    if (selectedPmId == null || !status?.daemonReachable) {
      setDetail(null);
      return;
    }
    void refreshDetail(selectedPmId).catch((err) => {
      setError(err instanceof Error ? err.message : "加载详情失败");
    });
  }, [refreshDetail, selectedPmId, status?.daemonReachable]);

  const maybeAutoSave = useCallback(async () => {
    if (getPm2AutoSave()) await pm2Save();
  }, []);

  const runAction = useCallback(
    async (action: "restart" | "stop" | "start") => {
      if (selectedPmId == null) return;
      setActing(true);
      setError(null);
      try {
        if (action === "restart") await pm2Restart(selectedPmId);
        if (action === "stop") await pm2Stop(selectedPmId);
        if (action === "start") await pm2Start(selectedPmId);
        await maybeAutoSave();
        await refreshProcesses();
        await refreshDetail(selectedPmId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "操作失败");
      } finally {
        setActing(false);
      }
    },
    [maybeAutoSave, refreshDetail, refreshProcesses, selectedPmId],
  );

  const saveDump = useCallback(async () => {
    setActing(true);
    try {
      await pm2Save();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setActing(false);
    }
  }, []);

  return {
    status,
    processes,
    selectedPmId,
    setSelectedPmId,
    detail,
    loading,
    error,
    acting,
    refetch,
    runAction,
    saveDump,
    maybeAutoSave,
  };
}
