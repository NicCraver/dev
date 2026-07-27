import type { Hono } from "hono";

const DEFAULT_UPSTREAM = "http://127.0.0.1:3100";

function getUpstream(): string {
  return (process.env.YAPI_UPSTREAM ?? DEFAULT_UPSTREAM).replace(/\/$/, "");
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

async function probeUpstream(upstream: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`${upstream}/api/user/status`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      return { ok: false, message: `YApi 返回 HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "无法连接 YApi";
    return { ok: false, message };
  }
}

export function registerYapiRoutes(app: Hono) {
  app.get("/api/yapi/status", async (c) => {
    const upstream = getUpstream();
    const probe = await probeUpstream(upstream);
    return c.json({
      configured: true,
      upstream,
      reachable: probe.ok,
      message: probe.ok ? "YApi 可达" : probe.message,
    });
  });

  app.all("/api/yapi/*", async (c) => {
    const upstream = getUpstream();
    const incoming = new URL(c.req.url);
    const targetPath = incoming.pathname.replace(/^\/api\/yapi/, "/api");
    const targetUrl = `${upstream}${targetPath}${incoming.search}`;

    const headers = new Headers();
    const cookie = c.req.header("cookie");
    if (cookie) headers.set("cookie", cookie);

    const contentType = c.req.header("content-type");
    if (contentType) headers.set("content-type", contentType);

    const accept = c.req.header("accept");
    if (accept) headers.set("accept", accept);

    const method = c.req.method;
    const body =
      method !== "GET" && method !== "HEAD" && method !== "OPTIONS"
        ? await c.req.arrayBuffer()
        : undefined;

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(targetUrl, {
        method,
        headers,
        body,
        redirect: "manual",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "YApi proxy failed";
      return c.json({ errcode: -1, errmsg: message }, 502);
    }

    const outHeaders = new Headers();
    upstreamRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (HOP_BY_HOP.has(lower)) return;
      if (lower === "set-cookie") {
        outHeaders.append("set-cookie", value);
        return;
      }
      outHeaders.set(key, value);
    });

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: outHeaders,
    });
  });
}
