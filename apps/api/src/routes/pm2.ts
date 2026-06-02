import type {
  Pm2ActionResponse,
  Pm2EcosystemParseResponse,
  Pm2EcosystemStartRequest,
  Pm2LogsResponse,
  Pm2QuickStartRequest,
  Pm2SaveResponse,
  Pm2StatusResponse,
  Pm2UnlockResponse,
} from "@mt-dev/shared";
import type { Hono } from "hono";
import pm2 from "pm2";
import type { LogPacket } from "pm2";

import {
  isPm2AuthRequired,
  isPagePasswordRequired,
  pm2AuthMiddleware,
  verifyPagePassword,
  createUnlockSession,
} from "../pm2/auth.ts";
import {
  describeProcess,
  isPm2Enabled,
  listProcesses,
  pingDaemon,
  readProcessLogs,
  restartProcess,
  savePm2Dump,
  startNewProcess,
  startProcessById,
  stopProcess,
} from "../pm2/client.ts";
import { findAppsByName, parseEcosystemContent } from "../pm2/ecosystem.ts";

function unreachable(c: { json: (body: unknown, status?: number) => Response }) {
  return c.json({ message: "PM2 daemon 不可达，请先启动 pm2" }, 503);
}

export function registerPm2Routes(app: Hono) {
  if (!isPm2Enabled()) {
    app.get("/api/pm2/status", (c) => {
      const body: Pm2StatusResponse = {
        enabled: false,
        authRequired: isPm2AuthRequired(),
        pagePasswordRequired: isPagePasswordRequired(),
        daemonReachable: false,
        message: "PM2 模块未启用",
      };
      return c.json(body);
    });
    return;
  }

  app.use("/api/pm2/*", pm2AuthMiddleware);

  app.get("/api/pm2/status", async (c) => {
    const reachable = await pingDaemon();
    const body: Pm2StatusResponse = {
      enabled: true,
      authRequired: isPm2AuthRequired(),
      pagePasswordRequired: isPagePasswordRequired(),
      daemonReachable: reachable,
      message: reachable ? undefined : "PM2 daemon 不可达",
    };
    return c.json(body);
  });

  app.post("/api/pm2/unlock", async (c) => {
    if (!isPagePasswordRequired()) {
      const body: Pm2UnlockResponse = { ok: true, unlockToken: "" };
      return c.json(body);
    }
    const { password } = (await c.req.json()) as { password?: string };
    if (!verifyPagePassword(password ?? "")) {
      return c.json({ message: "密码错误" }, 401);
    }
    const body: Pm2UnlockResponse = { ok: true, unlockToken: createUnlockSession() };
    return c.json(body);
  });

  app.get("/api/pm2/processes", async (c) => {
    if (!(await pingDaemon())) return unreachable(c);
    const processes = await listProcesses();
    return c.json({ processes });
  });

  app.get("/api/pm2/processes/:id", async (c) => {
    if (!(await pingDaemon())) return unreachable(c);
    const pmId = Number(c.req.param("id"));
    const detail = await describeProcess(pmId);
    if (!detail) return c.json({ message: "进程不存在" }, 404);
    return c.json(detail);
  });

  app.post("/api/pm2/processes/start", async (c) => {
    if (!(await pingDaemon())) return unreachable(c);
    const body = (await c.req.json()) as Pm2QuickStartRequest;
    if (!body.script?.trim() || !body.name?.trim()) {
      return c.json({ message: "script 与 name 必填" }, 400);
    }
    try {
      const pmId = await startNewProcess({
        script: body.script.trim(),
        name: body.name.trim(),
        cwd: body.cwd?.trim() || undefined,
        args: body.args,
        env: body.env,
        instances: body.instances,
      });
      const res: Pm2ActionResponse = { ok: true, pmId };
      return c.json(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : "启动失败";
      return c.json({ message }, 400);
    }
  });

  app.post("/api/pm2/processes/parse-ecosystem", async (c) => {
    const { content } = (await c.req.json()) as { content: string };
    try {
      const apps = parseEcosystemContent(content);
      const res: Pm2EcosystemParseResponse = { apps };
      return c.json(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : "解析失败";
      return c.json({ message }, 400);
    }
  });

  app.post("/api/pm2/processes/start-ecosystem", async (c) => {
    if (!(await pingDaemon())) return unreachable(c);
    const body = (await c.req.json()) as Pm2EcosystemStartRequest;
    try {
      const apps = findAppsByName(parseEcosystemContent(body.content), body.appNames);
      const started: number[] = [];
      for (const ecoApp of apps) {
        const pmId = await startNewProcess({
          script: ecoApp.script,
          name: ecoApp.name,
          cwd: ecoApp.cwd,
        });
        started.push(pmId);
      }
      return c.json({ ok: true, pmIds: started });
    } catch (err) {
      const message = err instanceof Error ? err.message : "启动失败";
      return c.json({ message }, 400);
    }
  });

  app.post("/api/pm2/processes/:id/restart", async (c) => {
    if (!(await pingDaemon())) return unreachable(c);
    const pmId = Number(c.req.param("id"));
    await restartProcess(pmId);
    const res: Pm2ActionResponse = { ok: true, pmId };
    return c.json(res);
  });

  app.post("/api/pm2/processes/:id/stop", async (c) => {
    if (!(await pingDaemon())) return unreachable(c);
    const pmId = Number(c.req.param("id"));
    await stopProcess(pmId);
    const res: Pm2ActionResponse = { ok: true, pmId };
    return c.json(res);
  });

  app.post("/api/pm2/processes/:id/start", async (c) => {
    if (!(await pingDaemon())) return unreachable(c);
    const pmId = Number(c.req.param("id"));
    await startProcessById(pmId);
    const res: Pm2ActionResponse = { ok: true, pmId };
    return c.json(res);
  });

  app.get("/api/pm2/processes/:id/logs", async (c) => {
    if (!(await pingDaemon())) return unreachable(c);
    const pmId = Number(c.req.param("id"));
    const lines = await readProcessLogs(pmId);
    const res: Pm2LogsResponse = { lines };
    return c.json(res);
  });

  app.get("/api/pm2/processes/:id/logs/stream", async (c) => {
    if (!(await pingDaemon())) return unreachable(c);
    const pmId = Number(c.req.param("id"));

    return new Response(
      new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const send = (data: string) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ line: data })}\n\n`));
          };

          pm2.launchBus((err, bus) => {
            if (err || !bus) {
              send(`[error] ${err?.message ?? "无法订阅日志"}`);
              controller.close();
              return;
            }

            const onLog = (packet: LogPacket) => {
              if (packet.process?.pm_id !== pmId) return;
              if (packet.data) send(packet.data);
            };

            bus.on("log:out", onLog);
            bus.on("log:err", onLog);

            c.req.raw.signal.addEventListener("abort", () => {
              bus.off("log:out", onLog);
              bus.off("log:err", onLog);
              controller.close();
            });
          });
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      },
    );
  });

  app.post("/api/pm2/save", async (c) => {
    if (!(await pingDaemon())) return unreachable(c);
    await savePm2Dump();
    const res: Pm2SaveResponse = { ok: true };
    return c.json(res);
  });
}
