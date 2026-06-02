import type {
  Pm2ActionResponse,
  Pm2EcosystemParseResponse,
  Pm2EcosystemStartRequest,
  Pm2LogsResponse,
  Pm2ProcessDetail,
  Pm2ProcessSummary,
  Pm2QuickStartRequest,
  Pm2StatusResponse,
} from "@mt-dev/shared";

import { getPm2Token, getPm2UnlockToken } from "./pm2-storage";

type ApiErrorBody = { message?: string };

function authHeaders(): HeadersInit {
  const token = getPm2Token();
  const unlock = getPm2UnlockToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (unlock) headers["X-PM2-Unlock"] = unlock;
  return headers;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.message ?? `请求失败 (${res.status})`;
  } catch {
    return `请求失败 (${res.status})`;
  }
}

export async function fetchPm2Status(): Promise<Pm2StatusResponse> {
  const res = await fetch("/api/pm2/status", { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Pm2StatusResponse>;
}

export async function unlockPm2Page(password: string): Promise<string> {
  const res = await fetch("/api/pm2/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const body = (await res.json()) as { ok: true; unlockToken: string };
  return body.unlockToken;
}

export async function fetchPm2Processes(): Promise<Pm2ProcessSummary[]> {
  const res = await fetch("/api/pm2/processes", { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  const body = (await res.json()) as { processes: Pm2ProcessSummary[] };
  return body.processes;
}

export async function fetchPm2ProcessDetail(pmId: number): Promise<Pm2ProcessDetail> {
  const res = await fetch(`/api/pm2/processes/${pmId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Pm2ProcessDetail>;
}

export async function fetchPm2Logs(pmId: number): Promise<string[]> {
  const res = await fetch(`/api/pm2/processes/${pmId}/logs`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  const body = (await res.json()) as Pm2LogsResponse;
  return body.lines;
}

export function subscribePm2Logs(
  pmId: number,
  onLine: (line: string) => void,
  onError?: (err: Error) => void,
): () => void {
  const controller = new AbortController();

  void (async () => {
    try {
      const res = await fetch(`/api/pm2/processes/${pmId}/logs/stream`, {
        headers: authHeaders(),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(await parseError(res));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const data = JSON.parse(line) as { line: string };
            onLine(data.line);
          } catch {
            onLine(line);
          }
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        onError?.(err instanceof Error ? err : new Error("日志流失败"));
      }
    }
  })();

  return () => controller.abort();
}

export async function pm2Restart(pmId: number): Promise<void> {
  const res = await fetch(`/api/pm2/processes/${pmId}/restart`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function pm2Stop(pmId: number): Promise<void> {
  const res = await fetch(`/api/pm2/processes/${pmId}/stop`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function pm2Start(pmId: number): Promise<void> {
  const res = await fetch(`/api/pm2/processes/${pmId}/start`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function pm2QuickStart(body: Pm2QuickStartRequest): Promise<number> {
  const res = await fetch("/api/pm2/processes/start", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as Pm2ActionResponse;
  return data.pmId;
}

export async function pm2ParseEcosystem(content: string): Promise<Pm2EcosystemParseResponse> {
  const res = await fetch("/api/pm2/processes/parse-ecosystem", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Pm2EcosystemParseResponse>;
}

export async function pm2StartEcosystem(body: Pm2EcosystemStartRequest): Promise<number[]> {
  const res = await fetch("/api/pm2/processes/start-ecosystem", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { pmIds: number[] };
  return data.pmIds;
}

export async function pm2Save(): Promise<void> {
  const res = await fetch("/api/pm2/save", { method: "POST", headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  await res.json();
}
