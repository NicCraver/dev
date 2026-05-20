import type { HealthResponse } from "@mt-dev/shared";
import {
  Activity01Icon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

type ConnectionState =
  | { kind: "loading" }
  | { kind: "success"; data: HealthResponse }
  | { kind: "error"; message: string };

export function HealthCheck() {
  const [state, setState] = useState<ConnectionState>({ kind: "loading" });

  const checkHealth = useCallback(async () => {
    setState({ kind: "loading" });

    try {
      const response = await fetch("/api/health");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as HealthResponse;

      if (data.status !== "ok") {
        throw new Error("Unexpected response");
      }

      setState({ kind: "success", data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState({ kind: "error", message });
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon icon={Activity01Icon} className="text-primary size-5" />
              <CardTitle>API 联调测试</CardTitle>
            </div>
            <CardDescription>
              验证前端与 Hono 后端 <code className="text-xs">/api/health</code> 连通性
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {state.kind === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-3 rounded-lg border border-dashed p-4"
                >
                  <Icon
                    icon={Loading03Icon}
                    className="text-muted-foreground size-5 animate-spin"
                  />
                  <span className="text-muted-foreground text-sm">正在连接后端…</span>
                </motion.div>
              )}

              {state.kind === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon icon={CheckmarkCircle01Icon} className="size-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium">连接成功</p>
                      <p className="text-muted-foreground text-xs">status: {state.data.status}</p>
                    </div>
                  </div>
                  <Badge variant="success">Online</Badge>
                </motion.div>
              )}

              {state.kind === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Icon icon={CancelCircleIcon} className="text-destructive size-5" />
                    <div>
                      <p className="text-sm font-medium">连接失败</p>
                      <p className="text-muted-foreground text-xs">{state.message}</p>
                    </div>
                  </div>
                  <Badge variant="destructive">Offline</Badge>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => void checkHealth()}
              disabled={state.kind === "loading"}
            >
              <Icon
                icon={Refresh01Icon}
                className={state.kind === "loading" ? "animate-spin" : ""}
              />
              重新检测
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
