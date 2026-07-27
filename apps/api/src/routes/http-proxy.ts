import type { Hono } from "hono";

const ALLOWED_HOSTS = new Set(["192.168.10.25", "zhixin.zhiguaniot.com"]);

type ProxyBody = {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export function registerHttpProxyRoutes(app: Hono) {
  app.post("/api/http-proxy", async (c) => {
    let payload: ProxyBody;
    try {
      payload = (await c.req.json()) as ProxyBody;
    } catch {
      return c.json({ message: "Invalid JSON body" }, 400);
    }

    const rawUrl = payload.url?.trim();
    if (!rawUrl) return c.json({ message: "url is required" }, 400);

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return c.json({ message: "Invalid url" }, 400);
    }

    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return c.json({ message: `Host not allowed: ${parsed.hostname}` }, 400);
    }

    const method = (payload.method ?? "GET").toUpperCase();
    const headers = new Headers();
    for (const [k, v] of Object.entries(payload.headers ?? {})) {
      if (!k || v == null) continue;
      const lower = k.toLowerCase();
      if (lower === "host" || lower === "content-length") continue;
      headers.set(k, String(v));
    }

    const hasBody =
      method !== "GET" && method !== "HEAD" && payload.body != null && payload.body !== "";
    const started = Date.now();

    try {
      const upstream = await fetch(parsed.toString(), {
        method,
        headers,
        body: hasBody ? payload.body : undefined,
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      const text = await upstream.text();
      const resHeaders: Record<string, string> = {};
      upstream.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });
      return c.json({
        status: upstream.status,
        statusText: upstream.statusText,
        headers: resHeaders,
        body: text,
        durationMs: Date.now() - started,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Proxy request failed";
      return c.json({ message, durationMs: Date.now() - started }, 502);
    }
  });
}
