import { readFile } from "node:fs/promises";

import type { Pm2ProcessDetail, Pm2ProcessSummary } from "@mt-dev/shared";
import pm2 from "pm2";
import type { Proc, ProcessDescription } from "pm2";

function promisify<T>(fn: (cb: (err: Error | null, res: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, res) => (err ? reject(err) : resolve(res)));
  });
}

let connected = false;

export async function ensurePm2Connected(): Promise<void> {
  if (connected) return;
  await promisify<void>((cb) => pm2.connect(cb));
  connected = true;
}

export function isPm2Enabled(): boolean {
  return process.env.PM2_ENABLED === "true";
}

export function mapProcess(proc: Proc): Pm2ProcessSummary {
  const monit = proc.monit ?? { cpu: 0, memory: 0 };
  return {
    pmId: proc.pm2_env?.pm_id ?? 0,
    name: proc.name ?? "",
    status: proc.pm2_env?.status ?? "unknown",
    cpu: monit.cpu ?? 0,
    memory: monit.memory ?? 0,
    uptime: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
    pid: proc.pid ?? 0,
    restartTime: proc.pm2_env?.restart_time ?? 0,
  };
}

export function mapDetail(desc: ProcessDescription): Pm2ProcessDetail {
  const base = mapProcess(desc as unknown as Proc);
  const env = desc.pm2_env;
  return {
    ...base,
    script: env?.pm_exec_path ?? "",
    cwd: env?.pm_cwd,
    args: env?.args,
    execMode: env?.exec_mode,
    instances: env?.instances,
    env: (env?.env ?? {}) as Record<string, string>,
  };
}

export async function listProcesses(): Promise<Pm2ProcessSummary[]> {
  await ensurePm2Connected();
  const list = await promisify<Proc[]>((cb) => pm2.list(cb));
  return list.map(mapProcess).sort((a, b) => a.name.localeCompare(b.name));
}

export async function describeProcess(pmId: number): Promise<Pm2ProcessDetail | null> {
  await ensurePm2Connected();
  const list = await promisify<ProcessDescription[]>((cb) => pm2.describe(pmId, cb));
  const first = list[0];
  return first ? mapDetail(first) : null;
}

export async function restartProcess(pmId: number): Promise<void> {
  await ensurePm2Connected();
  await promisify<Proc>((cb) => pm2.restart(pmId, cb));
}

export async function stopProcess(pmId: number): Promise<void> {
  await ensurePm2Connected();
  await promisify<Proc>((cb) => pm2.stop(pmId, cb));
}

export async function startProcessById(pmId: number): Promise<void> {
  await ensurePm2Connected();
  await promisify<Proc>((cb) => pm2.restart(pmId, cb));
}

function resolvePmIdFromStartResult(proc: Proc | Proc[]): number {
  if (Array.isArray(proc)) {
    return proc[0]?.pm2_env?.pm_id ?? 0;
  }
  return proc.pm2_env?.pm_id ?? 0;
}

export async function startNewProcess(options: {
  script: string;
  name: string;
  cwd?: string;
  args?: string[];
  env?: Record<string, string>;
  instances?: number;
}): Promise<number> {
  await ensurePm2Connected();
  const proc = await promisify<Proc | Proc[]>((cb) =>
    pm2.start(
      {
        script: options.script,
        name: options.name,
        cwd: options.cwd,
        args: options.args,
        env: options.env,
        instances: options.instances ?? 1,
      },
      cb,
    ),
  );
  return resolvePmIdFromStartResult(proc);
}

export async function savePm2Dump(): Promise<void> {
  await ensurePm2Connected();
  await promisify<void>((cb) => pm2.dump(cb));
}

async function readLogFile(path: string | undefined): Promise<string> {
  if (!path) return "";
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

export async function readProcessLogs(pmId: number): Promise<string[]> {
  await ensurePm2Connected();
  const list = await promisify<ProcessDescription[]>((cb) => pm2.describe(pmId, cb));
  const env = list[0]?.pm2_env;
  const outText = await readLogFile(env?.pm_out_log_path);
  const errText = await readLogFile(env?.pm_err_log_path);
  const lines = [outText, errText].join("\n").split("\n").filter(Boolean);
  return lines.slice(-200);
}

export async function pingDaemon(): Promise<boolean> {
  if (!isPm2Enabled()) return false;
  try {
    await ensurePm2Connected();
    return true;
  } catch {
    connected = false;
    return false;
  }
}
