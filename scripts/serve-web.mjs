/** 生产静态站 + /api 反代（无需 Nginx sudo，默认 :51611） */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, request } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../apps/web/dist", import.meta.url));
const PORT = Number(process.env.MT_DEV_WEB_PORT ?? 51611);
const API_HOST = process.env.MT_DEV_API_HOST ?? "127.0.0.1";
const API_PORT = Number(process.env.MT_DEV_API_PORT ?? 6333);

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function proxyApi(req, res) {
  const upstream = request(
    {
      hostname: API_HOST,
      port: API_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `${API_HOST}:${API_PORT}` },
    },
    (pres) => {
      res.writeHead(pres.statusCode ?? 502, pres.headers);
      pres.pipe(res);
    },
  );
  upstream.on("error", () => {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "api unreachable" }));
  });
  req.pipe(upstream);
}

function sendFile(res, filePath) {
  const type = MIME[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "content-type": type });
  createReadStream(filePath).pipe(res);
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(
    new URL(req.url ?? "/", `http://${req.headers.host}`).pathname,
  );
  const safePath = join(ROOT, urlPath);

  if (!safePath.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }

  if (existsSync(safePath) && statSync(safePath).isFile()) {
    sendFile(res, safePath);
    return;
  }

  const indexPath = join(ROOT, "index.html");
  if (existsSync(indexPath)) {
    sendFile(res, indexPath);
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}

createServer((req, res) => {
  if ((req.url ?? "/").startsWith("/api/")) {
    proxyApi(req, res);
    return;
  }
  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`mt-dev web → http://0.0.0.0:${PORT} (dist: ${ROOT})`);
});
