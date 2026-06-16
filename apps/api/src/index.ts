import "./load-env.ts";

import { serve } from "@hono/node-server";
import type { HealthResponse } from "@mt-dev/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { registerO5EnvRoutes } from "./routes/o5-env.ts";
import { registerMongoRoutes } from "./routes/mongo.ts";
import { registerPm2Routes } from "./routes/pm2.ts";

const PORT = Number(process.env.PORT ?? 6333);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:6111",
      "https://env.nextdev.cc",
      "http://env.lif3ng.cn",
      "https://env.lif3ng.cn",
      "http://env.nextdev.cc",
    ],
  }),
);

app.get("/api/health", (c) => {
  const body: HealthResponse = { status: "ok" };
  return c.json(body);
});

registerO5EnvRoutes(app);
registerMongoRoutes(app);
registerPm2Routes(app);

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`API server running at http://localhost:${info.port}`);
  },
);
