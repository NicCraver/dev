import { serve } from "@hono/node-server";
import type { HealthResponse } from "@mt-dev/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";

const PORT = Number(process.env.PORT ?? 6333);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:6111", "https://env.nextdev.cc"],
  }),
);

app.get("/api/health", (c) => {
  const body: HealthResponse = { status: "ok" };
  return c.json(body);
});

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`API server running at http://localhost:${info.port}`);
  },
);
