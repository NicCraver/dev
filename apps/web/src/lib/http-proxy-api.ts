export type HttpProxyRequest = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
};

export type HttpProxyResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
};

export class HttpProxyError extends Error {
  readonly status: number;
  readonly durationMs?: number;

  constructor(message: string, status: number, durationMs?: number) {
    super(message);
    this.name = "HttpProxyError";
    this.status = status;
    this.durationMs = durationMs;
  }
}

export async function sendViaProxy(req: HttpProxyRequest): Promise<HttpProxyResponse> {
  const res = await fetch("/api/http-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const json = (await res.json()) as HttpProxyResponse & { message?: string; durationMs?: number };
  if (!res.ok) {
    throw new HttpProxyError(
      json.message || `代理失败 (${res.status})`,
      res.status,
      json.durationMs,
    );
  }
  return {
    status: json.status,
    statusText: json.statusText || "",
    headers: json.headers || {},
    body: json.body ?? "",
    durationMs: json.durationMs ?? 0,
  };
}
